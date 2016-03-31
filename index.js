/**  @author Gilles Coomans <gilles.coomans@gmail.com> */

(function() {
	'use strict';

	var elenpi = require('elenpi'),
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
			return (input && input[0] !== '?') ? null : input;
		},
		s: function(input) { // string
			return (input && input[0] == '?') ? null : input;
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
			.regExp(/^\.|>/, true, function(descriptor, cap) {
				descriptor.local = true;
				if (cap[0] === '>')
					descriptor.lastMatched = true;
			})
			.regExp(/^\//)
			.rule('steps')
	};

	var parser = new elenpi.Parser(rules, 'route');

	var RouteStep = function(route) {};

	RouteStep.prototype.match = function(descriptor) {
		var ok = false;
		if (descriptor.route.length >= descriptor.index) {
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
					descriptor.params[this.key] = res;
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

	function Match(route, index) {
		this.route = route;
		this.index = index;
		this.params = {};
	}

	Match.prototype.toString = function() {
		return '/' + this.route.join('/') + ' (' + this.index + ':' + JSON.stringify(this.params) + ')';
	};

	var Route = function(route) {
		this.original = route;
		this.parsed = parser.parse(route);
		if (!this.parsed)
			throw new Error('route could not be parsed : ' + route);
		if (this.parsed.lastMatched)
			this.lastMatched = this.parsed.lastMatched;
	};

	Route.prototype.match = function(descriptor) {
		if (typeof descriptor === 'string') {
			var route = descriptor.split('/');
			if (route[0] === '')
				route.shift();
			if (route[route.length - 1] === '')
				route.pop();
			descriptor = new Match(route, 0);
		} else
			descriptor = new Match(descriptor.route, this.parsed.local ? descriptor.index : 0);
		if (!this.parsed.match(descriptor))
			return false;
		return descriptor;
	};

	module.exports = Route;
})();
