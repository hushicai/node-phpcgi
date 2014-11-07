/**
 * @file entry
 * @author hushicai(bluthcy@gmail.com)
 */

var phpcgi = require('./src/main');

// middleware
function fn(options) {
    var documentRoot = options.documentRoot;
    var handler = options.handler;

    // middleware
    return function(req, res, next) {
        return phpcgi({
            documentRoot: documentRoot,
            handler: handler,
            req: req,
            res: res,
            next: next
        });
    };
};

// edp php handler
fn.phpHandlerForEdp = function(options) {
    options = options || {};
    var handler = options.handler;
    return function(context) {
        return phpcgi({
            start: function() {
                context.stop();
            },
            documentRoot: context.documentRoot,
            handler: handler,
            req: context.request,
            res: context.response,
            end: function(e) {
                context.status = e.statusCode;
                context.content = e.body;
                var headers = e.headers || {};
                for (var key in headers) {
                    context.header[key] = headers[key];
                }
                context.phpOk = true;
                context.start();
            }
        });
    };
};

exports = module.exports = fn;
