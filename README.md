node-phpcgi
===========

A simple middleware for node to execute php with php-cgi.

## Foreword

Before using this, make sure you have already installed the `php-cgi`

__Note__:_Not the php command_.

## Quick Start

First, install it in your project directory:

```bash
npm install node-phpcgi
```

Then, use it in your node server like this:

```javascript
var middleware = require('node-phpcgi')({
    documentRoot: __dirname,
    // change it to your own handler path
    handler: '/usr/local/php/bin/php-cgi'
});
var app = http.createServer(function(req, res) {
    middleware(req, res, function(err) {});
});
```

If you are using [connect](https://github.com/senchalabs/connect), you can use it like this:

```javascript
var connect = require('connect');
var phpcgi = require('node-phpcgi')({
    documentRoot: __dirname,
    // change it to your own path
    handler: '/usr/local/php/bin/php-cgi'
});
var app = connect();
app.use(phpcgi);
```

If you are using `koa2`, you can use it like this:

```javascript
const Koa = require('koa');
const app = new Koa();

const phpcgi = require('node-phpcgi/koa');

app.use(phpcgi({documentRoot: __dirname}));
```

Specially for [edp](https://github.com/ecomfe/edp), you can use it like this:

```javascript
{
    location: /\.php($|\?)/,
    handler: [
        require('node-phpcgi/edp')()
    ]
}
```

## Customize

If you want to specify the arguments for php, just add them:

```javascript
var middleware = phpcgi({
    documentRoot: __dirname,
    // change it to your own path
    handler: '/usr/local/php/bin/php-cgi'
    // you can add any available php-cgi args here.
    args: ['-c', '/usr/local/php/lib/php.ini']
});
```

## Test

Clone into somewhere:

```bash
git clone https://github.com/hushicai/node-phpcgi.git
```

Before you can run the tests, you should change the handler path in the `test/spec.js` file:

```javascript
var middleware = phpcgi({
    documentRoot: __dirname + '/htdocs',
    // change it to your own path
    handler: '/usr/local/php/bin/php-cgi'
});
```

If you does not install the global `mocha`, install it:

```bash
npm install -g mocha
```

After that, you can do this:

```bash
# cd the repo directory
npm install
mocha
```

This package is inspired from [gateway](https://github.com/fgnass/gateway.git).
