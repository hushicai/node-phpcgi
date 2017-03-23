/**
 * @file edp php handler
 * @author hushicai(bluthcy@gmail.com)
 */

/* eslint-env node */

var phpcgi = require('../src/main');

exports = module.exports = function(options) {
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
          if (headers.hasOwnProperty(key)) {
            context.header[key] = headers[key];
          }
        }
        context.phpOk = true;
        context.start();
      }
    });
  };
};
