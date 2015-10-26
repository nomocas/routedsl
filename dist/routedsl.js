(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.routedsl = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**  @author Gilles Coomans <gilles.coomans@gmail.com> */

(function() {
	'use strict';

	var elenpi = require('elenpi/index'),
		r = elenpi.r;

	var casting = {
		i: function(input) { // integer
			var r = parseInt(input, 10);
			return (!isNaN(r) && r !== Infinity) ? r : null;
		},
		f: function(input) { // float
			var r = parseFloat(input);
			return (!isNaN(r) && r !== Infinity) ? r : null;
		},
		b: function(input) { // bool
			if (input === 'true')
				return true;
			if (input === 'false')
				return false;
			return null;
		},
		q: function(input) { // query
			return (input[0] !== '?') ? null : input;
		},
		s: function(input) { // string
			return (input[0] == '?') ? null : input;
		}
	};

	var rules = {
		disjonction: r()
			.regExp(/^\[\s*/)
			.oneOrMore('disjonction',
				r().rule('xpr'),
				r().regExp(/^\s*,\s*/)
			)
			.regExp(/^\s*\]/),

		cast: r()
			.regExp(/^([\w-_]+):/, true, function(descriptor, cap) {
				descriptor.cast = casting[cap[1]];
				if (!descriptor.cast)
					throw new Error('routes : no cast method as : ' + cap[1]);
			}),

		end: r()
			.regExp(/^\$/, false, 'end'),

		steps: r()
			.zeroOrMore('steps',
				r().rule('xpr'),
				r().regExp(/^\//)
			),

		block: r()
			.regExp(/^\(\s*/)
			.rule('steps')
			.regExp(/^\s*\)/),

		key: r()
			.regExp(/^[0-9\w-_\.]+/, false, 'key'),

		xpr: r()
			.oneOf(null, [
				r().regExp(/^\!/, false, 'not'),
				r().regExp(/^\?/, false, 'optional')
			], true)
			.oneOf(null, [r().rule('cast').rule('key'), 'end', 'disjonction', 'block']),

		route: r()
			.regExp(/^\./, true, 'local')
			.regExp(/^\//)
			.rule('steps')
	};

	var parser = new elenpi.Parser(rules, 'route');

	var RouteStep = function(route) {};

	RouteStep.prototype.match = function(descriptor) {
		var ok = false;
		if (descriptor.route.length > descriptor.index) {
			if (this.end) {
				if (descriptor.index === descriptor.route.length)
					ok = true;
			} else if (this.steps) { // block
				ok = this.steps.every(function(step) {
					return step.match(descriptor);
				});
			} else if (this.disjonction) {
				ok = this.disjonction.some(function(step) {
					return step.match(descriptor);
				});
			} else if (this.cast) { // casted variable
				var res = this.cast(descriptor.route[descriptor.index]);
				if (res !== null) {
					descriptor.output[this.key] = res;
					descriptor.index++;
					ok = true;
				}
			} else if (descriptor.route[descriptor.index] === this.key) {
				descriptor.index++;
				ok = true;
			}
		}
		if (this.not)
			ok = !ok;
		else if (!ok && this.optional)
			return true;
		return ok;
	};

	parser.createDescriptor = function() {
		return new RouteStep();
	};

	var Route = function(route) {
		this.parsed = parser.parse(route);
		if (!this.parsed)
			throw new Error('route could not be parsed : ' + route);
	};

	Route.prototype.match = function(descriptor) {
		if (typeof descriptor === 'string') {
			var route = descriptor.split('/');
			if (route[0] === '')
				route.shift();
			if (route[route.length - 1] === '')
				route.pop();
			descriptor = {
				route: route,
				index: 0,
				output: {}
			};
		} else
			descriptor = {
				route: descriptor.route,
				index: !this.parsed.local ? 0 : descriptor.index,
				output: {}
			};
		if (!this.parsed.match(descriptor))
			return false;
		return descriptor;
	};

	module.exports = Route;
})();

},{"elenpi/index":2}],2:[function(require,module,exports){
/**
 * Todo :
 * - oneOf : add optional flag
 * - add string 'arg and return' management in regExp handlers
 */
(function() {
    var defaultSpaceRegExp = /^[\s\n\r]+/;

    function exec(string, rule, descriptor, parser, opt) {
        if (typeof rule === 'string')
            rule = parser.rules[rule];
        var rules = rule._queue;
        for (var i = 0, len = rules.length; i < len /*&& string*/ ; ++i) {
            var current = rules[i];
            if (current.__lexer__)
                string = exec(string, current, descriptor, parser, opt);
            else // is function
                string = current.call(parser, string, descriptor, opt);
            if (string === false)
                return false;
        }
        return string;
    };

    function Rule() {
        this._queue = [];
        this.__lexer__ = true;
    };

    Rule.prototype = {
        // base for all rule's handlers
        done: function(callback) {
            this._queue.push(callback);
            return this;
        },
        // for debug purpose
        log: function(title) {
            title = title || '';
            return this.done(function(string, descriptor, opt) {
                console.log("elenpi.log : ", title, string, descriptor);
                return string;
            });
        },
        //
        regExp: function(reg, optional, as) {
            return this.done(function(string, descriptor, opt) {
                if (!string)
                    if (optional)
                        return string;
                    else
                        return false;
                var cap = reg.exec(string);
                if (cap) {
                    if (as) {
                        if (typeof as === 'string')
                            descriptor[as] = cap[0];
                        else
                            as.call(this, descriptor, cap, opt);
                    }
                    return string.substring(cap[0].length);
                }
                if (!optional)
                    return false;
                return string;
            });
        },
        char: function(test, optional) {
            return this.done(function(string, descriptor) {
                if (!string)
                    return false;
                if (string[0] === test)
                    return string.substring(1);
                if (optional)
                    return string;
                return false;
            });
        },
        xOrMore: function(name, rule, separator, minimum) {
            minimum = minimum || 0;
            return this.done(function(string, descriptor, opt) {
                var output = [];
                var newString = true,
                    count = 0;
                while (newString && string) {
                    var newDescriptor = name ? (this.createDescriptor ? this.createDescriptor() : {}) : descriptor;
                    newString = exec(string, rule, newDescriptor, this, opt);
                    if (newString !== false) {
                        count++;
                        string = newString;
                        if (!newDescriptor.skip)
                            output.push(newDescriptor);
                        if (separator && string) {
                            newString = exec(string, separator, newDescriptor, this, opt);
                            if (newString !== false)
                                string = newString;
                        }
                    }
                }
                if (count < minimum)
                    return false;
                if (name && output.length)
                    descriptor[name] = output;
                return string;
            });
        },
        zeroOrMore: function(as, rule, separator) {
            return this.xOrMore(as, rule, separator, 0);
        },
        oneOrMore: function(as, rule, separator) {
            return this.xOrMore(as, rule, separator, 1);
        },
        zeroOrOne: function(as, rule) {
            if (arguments.length === 1) {
                rule = as;
                as = null;
            }
            return this.done(function(string, descriptor, opt) {
                if (!string)
                    return string;
                var newDescriptor = as ? (this.createDescriptor ? this.createDescriptor() : {}) : descriptor,
                    res = exec(string, rule, newDescriptor, this, opt);
                if (res !== false) {
                    if (as)
                        descriptor[as] = newDescriptor;
                    string = res;
                }
                return string;
            });
        },
        oneOf: function(as, rules, optional) {
            if (arguments.length === 1) {
                rules = as;
                as = null;
            }
            return this.done(function(string, descriptor, opt) {
                if (!string)
                    return false;
                var count = 0;
                while (count < rules.length) {
                    var newDescriptor = as ? (this.createDescriptor ? this.createDescriptor() : {}) : descriptor,
                        newString = exec(string, rules[count], newDescriptor, this, opt);
                    if (newString !== false) {
                        if (as)
                            descriptor[as] = newDescriptor;
                        return newString;
                    }
                    count++;
                }
                if (optional)
                    return string;
                return false;
            });
        },
        rule: function(name) {
            return this.done(function(string, descriptor, opt) {
                var rule = this.rules[name];
                if (!rule)
                    throw new Error('elenpi.Rule :  rules not found : ' + name);
                return exec(string, rule, descriptor, this, opt);
            });
        },
        skip: function() {
            return this.done(function(string, descriptor) {
                descriptor.skip = true;
                return string;
            });
        },
        space: function(needed) {
            return this.done(function(string, descriptor) {
                if (!string)
                    if (needed)
                        return false;
                    else
                        return string;
                var cap = (this.rules.space || defaultSpaceRegExp).exec(string);
                if (cap)
                    return string.substring(cap[0].length);
                else if (needed)
                    return false;
                return string;
            });
        },
        end: function(needed) {
            return this.done(function(string, descriptor) {
                if (!string || !needed)
                    return string;
                return false;
            });
        }
    };

    var Parser = function(rules, defaultRule) {
        this.rules = rules;
        this.defaultRule = defaultRule;
    };
    Parser.prototype = {
        exec: function(string, descriptor, rule, opt) {
            if (!rule)
                rule = this.rules[this.defaultRule];
            return exec(string, rule, descriptor, this, opt);
        },
        parse: function(string, rule, opt) {
            var descriptor = this.createDescriptor ? this.createDescriptor() : {};
            var ok = this.exec(string, descriptor, rule, opt);
            if (ok === false || ok.length > 0)
                return false;
            return descriptor;
        }
    };

    var elenpi = {
        r: function() {
            return new Rule();
        },
        Rule: Rule,
        Parser: Parser
    };

    if (typeof module !== 'undefined' && module.exports)
        module.exports = elenpi; // use common js if avaiable
    else this.elenpi = elenpi; // assign to global window
})();
//___________________________________________________

},{}]},{},[1])(1)
});