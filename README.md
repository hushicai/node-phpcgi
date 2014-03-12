node-phpcgi
===========

Execute php in node with php-cgi。

## quick start

First, install it in your project directory:

```bash
npm install node-phpcgi
```

then, use it in your node server like this:

```javascript
var middleware = require('node-phpcgi')({
    documentRoot: './htdocs',
    handler: '/usr/local/php/bin/php-cgi'
});
var app = http.createServer(function(req, res) {
    middleware(req, res, function(err, result) {
        // result: {statusCode: 200, headers: {content-type: 'text/html'}, body: 'html'}
    });
});
```

Specially, for [edp](https://github.com/ecomfe/edp), in the `edp-webserver-config.js`：

```javascript
// ...
var phpcgi = require('node-phpcgi')({
    documentRoot: './',
    handler: '/usr/local/php/bin/php'
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

## test

```bash
npm install -g mocha

# cd the repo directory
mocha
```

This repo is inspired from [gateway](https://github.com/fgnass/gateway.git).
