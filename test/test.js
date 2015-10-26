/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 *
 */
if (typeof require !== 'undefined')
	var chai = require("chai"),
		routedsl = require("../index"),
		v = routedsl.v;
else
	var v = routedsl.v;

var expect = chai.expect;

describe("local", function() {
	var url = '/bloupi/lollipop/foo/bar';

	var route = new routedsl('/s:bloupi/s:lollipop');
	var route2 = new routedsl('./s:foo/s:bar');

	var desc = route.match(url);
	var desc2 = route2.match(desc);

	it("should", function() {
		expect(desc.index).to.equals(2)
		expect(desc.output).to.deep.equals({
			bloupi: 'bloupi',
			lollipop: 'lollipop'
		});
		expect(desc2.index).to.equals(4)
		expect(desc2.output).to.deep.equals({
			foo: 'foo',
			bar: 'bar'
		});
	});
});
