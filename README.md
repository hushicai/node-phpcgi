node-phpcgi
===========

Execute php in node with php-cgi.

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
    middleware(req, res, function(err, result) {
        // result: {statusCode: 200, headers: {content-type: 'text/html'}, body: 'html'}
    });
});
```

Specially, for [edp](https://github.com/ecomfe/edp), in the `edp-webserver-config.js`:

```javascript
// ...
var phpcgi = require('node-phpcgi')({
    documentRoot: __dirname,
    // change it to your own handler path
    // note: double backslash char `\\` in windows style path
    // windows: "C:\\Program Files\\PHP\\php-cgi.exe"
    handler: '/usr/local/php/bin/php-cgi'
});
// ...
exports.getLocations = {
    return [
        // ...
        {
            location: /\.php($|\?)/,
            handler: [
                function(context) {
                    context.stop();
                    phpcgi(context.req, context.res, function(err, result) {
                        context.status = result.statusCode;
                        context.headers = result.headers;
                        context.content = result.body;
                        context.start();
                    });
                }
            ]
        }
        // ...
    ];
};
```

## Test

### Before test

Before you can run the tests, you should change the handler path in the `test/spec.js` file:

```javascript
var middleware = phpcgi({
    documentRoot: __dirname + '/htdocs',
    // change it to your own path
    handler: '/usr/local/php2/bin/php-cgi'
});
```

After that, you can do this:

```bash
npm install -g mocha

# cd the repo directory
npm install supertest
mocha
```

This package is inspired from [gateway](https://github.com/fgnass/gateway.git).
