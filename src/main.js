/* eslint-env node  */


var url = require('url');
var path = require('path');
var fs = require('fs');

/**
 * a simple parser for http response string
 *
 * @private
 * @param {Object} source source
 * @return {Object} result {headers: {Status: 200, 'content-type': 'text/html'}, body: 'xxxx'}
 */
function parse(source) {
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
        }
        else {
            break;
        }
    }
    result.headers = headers;

    // body
    // join '\r\n' back to the body string
    result.body = lines.join('\r\n');

    return result;
}

var HEADER_NEED_HTTP_PREFIX = [
    'COOKIE',
    'HOST',
    'REFERER',
    'USER-AGENT',
    'CONNECTION',
    'ACCEPT',
    'ACCEPT-ENCODING',
    'ACCEPT_LANGUAGE'
];

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
 * @param {HttpRequest} options.req req
 * @param {HttpResponse} options.res res
 * @return {void} none
 */
exports = module.exports = function(options) {
    options = options || {};

    var documentRoot = options.documentRoot || '.';
    var handler = options.handler || 'php-cgi';
    var req = options.req;
    var res = options.res;
    var next = options.next || empty;

    // 请求开始
    var start = options.start || empty;

    // 请求结束
    var end = options.end || function(e) {
        var statusCode = e.statusCode;
        var headers = e.headers;
        var body = e.body || '';

        res.writeHead(statusCode, headers);
        res.end(body);
    };

    var info = url.parse(req.url);
    var scriptName = info.pathname;
    var ext = path.extname(scriptName);

    if (['.php'].indexOf(ext) < 0) {
        return next();
    }

    start();

    console.log('PHP Request: ' + req.url);

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
    var env = {
        PATH: process.env.PATH,
        GATEWAY_INTERFACE: 'CGI/1.1',
        SERVER_PROTOCOL: 'HTTP/1.1',
        SERVER_ROOT: documentRoot,
        DOCUMENT_ROOT: documentRoot,
        REDIRECT_STATUS: 200,
        SERVER_NAME: host[0],
        SERVER_PORT: host[1] || 80,
        SCRIPT_NAME: scriptName,
        REQUEST_URI: scriptName,
        SCRIPT_FILENAME: scriptFileName,
        REQUEST_METHOD: method,
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

    var child = require('child_process').spawn(
        handler,
        [],
        {
            env: env
        }
    );

    // specially for post
    // pipe data into child progress
    // if not, php-cgi could not receive the post data, and exit with something error.
    if (req.readable) {
        req.pipe(child.stdin);
    }
    else if (req.body) {
        child.kill('SIGHUP');
        return end({
            statusCode: 502,
            body: 'phpcgi could not receive data. please check if you are using body-parser or multer.'
        });
    }
    else if (req.bodyBuffer) {
        // edp
        child.stdin.end(req.bodyBuffer);
    }

    // buffer data
    var buffer = [];

    // The child process can't be spawned
    child.on(
        'error',
        function() {
            return error('You may have a wrong php-cgi path.');
        }
    );

    // dump stderr info
    child.stderr
        .on(
            'data',
            function() {
                console.log(
                    'php-cgi error data: ' + [].slice.call(arguments)
                );
            }
        );

    // collect data
    child.stdout
        .on(
            'data',
            function(buf) {
                buffer.push(buf);
            }
        )
        // multi-byte char, like zh-cn, buffer data may lead to messy code.
        .setEncoding('utf8');

    // done
    child.on('close', function(code) {
        if (code) {
            return error('phpcgi exited with code ' + code);
        }
        return done();
    });


    // exit with error
    function error(err) {
        console.log(err);

        return end({
            statusCode: 500,
            body: 'service unavailable!'
        });
    }

    // success with data
    function done() {
        var result = parse(buffer.join(''));

        result.headers.Status = result.headers.Status || '200 OK';
        result.statusCode = parseInt(result.headers.Status, 10);

        return end(result);
    }
};
