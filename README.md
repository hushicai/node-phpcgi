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
    documentRoot __dirname,
    // change it to your own path
    handler: '/usr/local/php2/bin/php-cgi'
});
var app = connect();
app.use(phpcgi);
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
    handler: '/usr/local/php2/bin/php-cgi'
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
