/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 *
 */
if (typeof require !== 'undefined')
	var chai = require("./chai"),
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
		expect(desc.params).to.deep.equals({
			bloupi: 'bloupi',
			lollipop: 'lollipop'
		});
		expect(desc2.index).to.equals(4)
		expect(desc2.params).to.deep.equals({
			foo: 'foo',
			bar: 'bar'
		});
	});
});

describe("not match ", function() {
	var url = '/';
	var route = new routedsl('/foo');
	var desc = route.match(url);

	it("should", function() {
		expect(desc).to.equals(false);
	});
});

describe("match key", function() {
	var url = '/foo';
	var route = new routedsl('/foo');
	var desc = route.match(url);

	it("should", function() {
		expect(desc).to.not.equals(false);
		expect(desc.index).to.equals(1);
		expect(desc.params).to.deep.equals({});
	});
});


describe("not match key", function() {
	var url = '/!foo';
	var route = new routedsl('/foo');
	var desc = route.match(url);

	it("should", function() {
		expect(desc).to.equals(false);
	});
});

describe("match optional key", function() {
	var url = '/bar';
	var route = new routedsl('/?bar');
	var desc = route.match(url);

	it("should", function() {
		expect(desc).to.not.equals(false);
		expect(desc.index).to.equals(1);
		expect(desc.params).to.deep.equals({});
	});
});

describe("not match with optional key", function() {
	var url = '/foo';
	var route = new routedsl('/?bar');
	var desc = route.match(url);

	it("should", function() {
		expect(desc).to.equals(false);
	});
});

describe(" match with or", function() {
	var url = '/bar';
	var route = new routedsl('/[bar,$]');
	var desc = route.match('/bar') && route.match('/');

	it("should", function() {
		expect(desc).to.not.equals(false);
	});
});


describe("end at root", function() {
	var url = '/';
	var route = new routedsl('/$');
	var desc = route.match(url);

	it("should", function() {
		expect(desc).to.not.equals(false);
		expect(desc.index).to.equals(0);
		expect(desc.params).to.deep.equals({});
	});
});


describe("root match and route has more parts", function() {
	var url = '/foo';
	var route = new routedsl('/');
	var desc = route.match(url);

	it("should", function() {
		expect(desc).to.not.equals(false);
		expect(desc.index).to.equals(0);
		expect(desc.params).to.deep.equals({});
	});
});
