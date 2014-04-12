var url = require('url');
var path = require('path');
var fs = require('fs');

/**
 * a simple parser for http response string
 *
 * @private
 * @return {Object} result {headers: {Status: 200, 'content-type': 'text/html'}, body: 'xxxx'}
 */
function parse(source) {
    var result = {};
    var lines = source.split('\r\n');
    var line;

    // headers
    var headers = {};
    while(lines.length) {
        line = lines.shift();
        if (line) {
            line = line.split(':');
            headers[line[0]] = line[1];
        } else {
            break;
        }
    }
    result['headers'] = headers;

    // body
    // join '\r\n' back to the body string
    result['body'] = lines.join('\r\n');

    return result;
}

var HEADER_NEED_HTTP_PREFIX = [
    'COOKIE',
    "HOST",
    "REFERER",
    "USER-AGENT",
    "CONNECTION",
    "ACCEPT",
    "ACCEPT-ENCODING",
    "ACCEPT_LANGUAGE"
];

function isNeedHttpPrefix(header) {
    return HEADER_NEED_HTTP_PREFIX.indexOf(header.toUpperCase()) > -1;
}

/**
 * phpcgi
 *
 * @param {Object} options 
 * @param {string} options.documentRoot 
 * @param {strgin} options.handler the `php-cgi` executable file path, etc：
 *      1. posix: `/usr/local/php/bin/php-cgi`
 *      2. windows: `c:\\Program Files\\PHP\\php-cgi.exe`
 */
exports = module.exports = function(options) {
    options = options || {};

    var docRoot = options.documentRoot || "";
    var handler = options.handler || "php-cgi";
    var exts = options.exts || ['.php'];

    return function(req, res, next) {
        req.pause();
        
        var info = url.parse(req.url);
        var scriptName = info.pathname;
        var ext = path.extname(scriptName);

        if (exts.indexOf(ext) < 0) {
            return next();
        }

        var query = info.query;
        var method = req.method;
        var scriptFileName = path.normalize(docRoot + scriptName);

        // windows may fail when the request file does not exist in the documentRoot
        // so check it before spawn a child process
        if (!fs.existsSync(scriptFileName)) {
            res.writeHead(404);
            return res.end('No input file specified');
        }

        // @see: http://www.cgi101.com/book/ch3/text.html
        var headers = req.headers;
        var host = (headers.host || '').split(':');
        var env = {
            PATH: process.env.PATH,
            GATEWAY_INTERFACE: 'CGI/1.1',
            SERVER_PROTOCOL: 'HTTP/1.1',
            SERVER_ROOT: docRoot,
            DOCUMENT_ROOT: docRoot,
            REDIRECT_STATUS: 200,
            SERVER_NAME: host[0],
            SERVER_PORT: host[1] || 80,
            REDIRECT_STATUS: 200,
            SCRIPT_NAME: scriptName, 
            REQUEST_URI: scriptName,
            SCRIPT_FILENAME: scriptFileName,
            REQUEST_METHOD: method,
            QUERY_STRING: query || ''
        };
        // @see: http://en.wikipedia.org/wiki/Common_Gateway_Interface
        // @see: http://livedocs.adobe.com/coldfusion/8/htmldocs/help.html?content=Expressions_8.html
        for (var header in headers) {
            var name = header.toUpperCase().replace(/-/g, '_');
            if(isNeedHttpPrefix(header)) {
                name = 'HTTP_' + name;
            }

            env[name] = headers[header];
        }

        var child = require('child_process').spawn(
            handler,
            [],
            {
                env: env
            }
        );

        // buffer data
        var buffer = [];

        // The child process can't be spawned
        child.on(
            'error',
            function(err) {
                return error('You may have a wrong php-cgi path.');
            }
        );

        // dump stderr info
        child.stderr
            // the `end` event seems to happen always? 
            .on(
                'end',
                function() {}
            )
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
                'end',
                done
            )
            .on(
                'data', 
                function(buf) {
                    buffer.push(buf);
                }
            )
            // multi-byte char, like zh-cn, buffer data may lead to messy code.
            .setEncoding('utf8');

        // specially for post
        // pipe data into child progress
        // if not, php-cgi could not receive the post data, and exit with something error.
        req.pipe(child.stdin);
        req.resume();

        // exit with error
        function error(err) {
            console.log(err);
            res.writeHead(500);
            res.end(err || 'service unavailable!');
        }

        // success with data
        function done() {
            var result = parse(buffer.join(''));

            result.headers.Status = result.headers.Status || "200 OK";
            result.statusCode = parseInt(result.headers.Status, 10); 

            // response
            res.writeHead(result.statusCode, result.headers);
            res.end(result.body || '');
        }
    };
}
