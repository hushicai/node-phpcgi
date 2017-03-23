/**
 * @file entry for koa
 * @author hushicai(bluthcy@gmail.com)
 */

// need to compile

var phpcgi = require('../src/main');

function getCgiFn (options) {
  options = options || {};

  var handler = options.handler;
  var documentRoot = options.documentRoot;

  return (ctx) => {
    return new Promise((resolve, reject) => {
      phpcgi({
        documentRoot: documentRoot,
        handler: handler,
        req: ctx.request,
        res: ctx.response,
        next: reject,
        end: resolve
      });
    });
  };
}

exports = module.exports = function (options) {
  var getCgi = getCgiFn(options);

  return async function (ctx, next) {
    try {
      let e = await getCgi(ctx);

      var headers = e.headers || {};

      for (var key in headers) {
        if (headers.hasOwnProperty(key)) {
          ctx.set(key, headers[key]);
        }
      }

      ctx.status = e.statusCode;
      ctx.body = e.body;
    }
    catch (ex) {
      await next();
    }
  };
};
