# routedsl

Small route DSL.

## Install

```shell
npm i routedsl
# or
bower i routedsl
# or
git clone https://github.com/nomocas/routedsl.git
```

## Example

```javascript
var Route = require('routedsl');
var route = new Route('/hello/s:arg'),
	matched = route.match('/hello/world');

// matched = { index: 2, route: ['hello', 'world'], output: { arg:'world' } }	
```

## Syntax

Full example : `/campaign/?s:id/update/?q:query/?[(i:start/i:end)/$,$]`

### key

`/aKey`

### casting

```javascript
var route = new Route('/foo/i:bar');
var matched = route.match('/foo/12');
// matched = { index:2, route:['foo', '12'], output:{ bar:12 } };
```

List of casting :
- i: integer
- f: float
- b: bool
- q: query (a string strting with '?')
- s: a string

### not

```javascript
var route = new Route('/!foo/bar');
var matched = route.match('/zoo/bar');
// matched = { index:2, route:['zoo', 'bar'] };
//...

matched = route.match('/foo/bar');
// matched = false
```


### optional
```javascript
var route = new Route('/foo/?bar');
var matched = route.match('/foo/bar');
// matched = { index:2, route:['foo', 'bar'] };
//...

matched = route.match('/foo');
// matched = { index:1, route:['foo'] };
```

### disjonction
```javascript
var route = new Route('/foo/[bar,zoo]');
var matched = route.match('/foo/bar');
// matched = { index:2, route:['foo', 'bar'] };
//...

matched = route.match('/foo/zoo');
// matched = { index:2, route:['foo', 'zoo'] };
```

### block
```javascript
var route = new Route('/foo/(bar/zoo)');
var matched = route.match('/foo/bar');
// matched = false;
//...

matched = route.match('/foo/bar/zoo');
// matched = { index:3, route:['foo','bar','zoo'] };
```

### end
```javascript
var route = new Route('/foo/$');
var matched = route.match('/foo/bar');
// matched = false;
//...

matched = route.match('/foo');
// matched = { index:1, route:['foo'] };
```

### local
```javascript
var route = new Route('/foo'),
	route2 = new Route('./bar');
var matched = route.match('/foo/bar');
// matched = { index:1, route:['foo', 'bar'] };
//...

var matched2 = route2.match(matched);
// matched2 = { index:2, route:['foo', 'bar'] };
```

## Tests

### Under nodejs

You need to have mocha installed globally before launching test. 
```
> npm install -g mocha
```
Do not forget to install dev-dependencies. i.e. : from 'routedsl' folder, type :
```
> npm install
```

then, always in 'routedsl' folder simply enter :
```
> mocha
```

### In the browser

Simply serve "routedsl" folder in you favorite web server then open ./index.html.

You could use the provided "gulp web server" by entering :
```
> gulp serve-test
```


## Licence

The [MIT](http://opensource.org/licenses/MIT) License

Copyright (c) 2015 Gilles Coomans <gilles.coomans@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
