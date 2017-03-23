/**
 * @file entry
 * @author hushicai(bluthcy@gmail.com)
 */

/* eslint-env node  */

var phpcgi = require('../src/main');

// middleware
function fn(options) {
    var documentRoot = options.documentRoot;
    var handler = options.handler;
    var phpcgiArguments = options.args;
    var extensions = options.extensions;
    var includePath = options.includePath;
    var entryPoint = options.entryPoint;

    // middleware
    return function(req, res, next) {
        return phpcgi({
            documentRoot: documentRoot,
            handler: handler,
            args: phpcgiArguments,
            req: req,
            res: res,
            next: next,
            extensions: extensions,
            includePath: includePath,
            entryPoint: entryPoint
        });
    };
}

exports = module.exports = fn;
