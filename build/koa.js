module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * @file main
 * @author hushicai(bluthcy@gmail.com)
 */

/* eslint-env node  */

var url = __webpack_require__(8);
var path = __webpack_require__(7);
var fs = __webpack_require__(6);

function bufferToString(buffer) {
    return Buffer.concat(buffer).toString();
}

/**
 * a simple parser for http response string
 *
 * @private
 * @param {Buffer} buffer buffer
 * @return {Object} result {headers: {Status: 200, 'content-type': 'text/html'}, body: 'xxxx'}
 */
function parse(buffer) {
    var source = bufferToString(buffer);
    // http spec: use `\r\n` as line break, except body
    var result = {};
    var lines = source.split('\r\n');
    var line;

    // headers
    var headers = {};
    while (lines.length) {
        line = lines.shift();
        if (line) {
            line = line.split(':');
            headers[line[0]] = line[1];
        } else {
            break;
        }
    }
    result.headers = headers;

    // body
    // if body has `\r\n`, join it back to the body string
    result.body = lines.join('\r\n');

    return result;
}

var HEADER_NEED_HTTP_PREFIX = ['COOKIE', 'HOST', 'REFERER', 'USER-AGENT', 'CONNECTION', 'ACCEPT', 'ACCEPT-ENCODING', 'ACCEPT-LANGUAGE'];

function isNeedHttpPrefix(header) {
    return HEADER_NEED_HTTP_PREFIX.indexOf(header.toUpperCase()) > -1;
}

function empty() {}

/**
 * phpcgi
 *
 * @public
 * @param {Object} options options
 * @param {string} options.documentRoot root
 * @param {?string} options.handler handler
 * @param {?array} options.args args
 * @param {HttpRequest} options.req req
 * @param {HttpResponse} options.res res
 * @return {void} none
 */
exports = module.exports = function (options) {
    options = options || {};

    var documentRoot = options.documentRoot || '.';
    var handler = options.handler || 'php-cgi';
    var phpcgiArguments = options.args || [];
    var extensions = options.extensions || ['.php'];
    var includePath = options.includePath || false;
    var req = options.req;
    var res = options.res;
    var next = options.next || empty;

    // 请求开始
    var start = options.start || empty;

    // 请求结束
    var end = options.end || function (e) {
        var statusCode = e.statusCode;
        var headers = e.headers;
        var body = e.body || '';

        res.writeHead(statusCode, headers);
        res.end(body);
    };

    var info = url.parse(req.url);
    var scriptName = options.entryPoint || info.pathname;
    var requestPath = info.pathname;
    var ext = path.extname(requestPath);

    if (extensions.indexOf(ext) < 0 && (includePath === false || requestPath.search(new RegExp('^' + includePath)) < 0)) {
        return next();
    }

    start();

    console.log('PHP Request: ' + req.method + ' ' + req.url);

    var query = info.query;
    var method = req.method;
    var scriptFileName = path.normalize(documentRoot + scriptName);

    // windows may fail when the request file does not exist in the documentRoot
    // so check it before spawn a child process
    if (!fs.existsSync(scriptFileName)) {
        return end({
            statusCode: 404,
            body: 'No input file specified!'
        });
    }

    // @see: http://www.cgi101.com/book/ch3/text.html
    var headers = req.headers;
    var host = (headers.host || '').split(':');
    var hostname = host[0];
    var port = host[1] || 80;
    var env = {
        PATH: process.env.PATH,
        GATEWAY_INTERFACE: 'CGI/1.1',
        SERVER_SOFTWARE: 'node',
        SERVER_PROTOCOL: 'HTTP/1.1',
        SERVER_ROOT: documentRoot,
        DOCUMENT_ROOT: documentRoot,
        REDIRECT_STATUS: 200,
        SERVER_NAME: hostname,
        SERVER_PORT: port,
        // 非必须
        // REMOTE_ADDR: req.connection.remoteAddress,
        // REMOTE_PORT: port,
        // HTTPS: req.connection.encrypted ? 'On' : 'Off',
        REQUEST_METHOD: method,
        REQUEST_URI: req.url,
        SCRIPT_NAME: scriptName,
        SCRIPT_FILENAME: scriptFileName,
        QUERY_STRING: query || ''
    };
    // @see: http://en.wikipedia.org/wiki/Common_Gateway_Interface
    // @see: http://livedocs.adobe.com/coldfusion/8/htmldocs/help.html?content=Expressions_8.html
    for (var header in headers) {
        if (headers.hasOwnProperty(header)) {
            var name = header.toUpperCase().replace(/-/g, '_');
            if (isNeedHttpPrefix(header)) {
                name = 'HTTP_' + name;
            }

            env[name] = headers[header];
        }
    }

    var child = __webpack_require__(5).spawn(handler, phpcgiArguments, {
        env: env,
        detached: true
    });

    // specially for post
    // pipe data into child progress
    // if not, php-cgi could not receive the post data, and exit with something error.
    if (req.readable) {
        req.pipe(child.stdin);
    } else if (req.body) {
        child.kill('SIGHUP');
        return end({
            statusCode: 502,
            body: 'phpcgi could not receive data. please check if you are using body-parser or multer.'
        });
    } else if (req.bodyBuffer) {
        // edp
        child.stdin.end(req.bodyBuffer);
    }

    // buffer data
    var buffer = [];

    // The child process can't be spawned
    child.on('error', function () {
        return error('You may have a wrong php-cgi path.');
    });

    // dump stderr info
    child.stderr.on('data', function () {
        console.log('php-cgi error data: ' + [].slice.call(arguments));
    });

    // collect data
    child.stdout.on('data', function (buf) {
        buffer.push(buf);
    });
    // multi-byte char, like zh-cn, buffer data may lead to messy code.
    // .setEncoding('utf8');

    // done
    child.on('close', function (code) {
        if (code) {
            return error('phpcgi exited with code ' + code);
        }
        return done();
    });

    // exit with error
    function error(err) {
        console.log(err);

        // code如果非0，说明php-cgi异常退出了
        // 但是异常退出，有可能是php程序错误导致的
        // 因此，这里还得判断一下buffer
        // 如果buffer中有数据，则把buffer内容返回
        var result = {};
        if (buffer.length) {
            result = parse(buffer);
        } else {
            result.body = 'service unavailable!';
        }
        result.statusCode = 500;

        return end(result);
    }

    // success with data
    function done() {
        var result = parse(buffer);

        result.headers.Status = result.headers.Status || '200 OK';
        result.statusCode = parseInt(result.headers.Status, 10);

        return end(result);
    }
};

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("babel-runtime/core-js/promise");

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("babel-runtime/helpers/asyncToGenerator");

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("babel-runtime/regenerator");

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _regenerator = __webpack_require__(3);

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = __webpack_require__(2);

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = __webpack_require__(1);

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @file entry for koa
 * @author hushicai(bluthcy@gmail.com)
 */

var phpcgi = __webpack_require__(0);

function getCgiFn(options) {
  options = options || {};

  var handler = options.handler;
  var documentRoot = options.documentRoot;

  return function (ctx) {
    return new _promise2.default(function (resolve, reject) {
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

  return function () {
    var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(ctx, next) {
      var e, headers, key;
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              _context.next = 3;
              return getCgi(ctx);

            case 3:
              e = _context.sent;
              headers = e.headers || {};


              for (key in headers) {
                if (headers.hasOwnProperty(key)) {
                  ctx.set(key, headers[key]);
                }
              }

              ctx.status = e.statusCode;
              ctx.body = e.body;
              _context.next = 14;
              break;

            case 10:
              _context.prev = 10;
              _context.t0 = _context['catch'](0);
              _context.next = 14;
              return next();

            case 14:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this, [[0, 10]]);
    }));

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }();
};

/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = require("child_process");

/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = require("url");

/***/ })
/******/ ]);