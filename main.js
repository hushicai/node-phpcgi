var url = require('url');
var path = require('path');

// a simple parser for http response string without status line 
function parse(source) {
    var result = {};
    var lines = source.split('\r\n');
    var line;

    var headers = {};
    // headers
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
    result['body'] = lines.join('');

    return result;
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
    var docRoot = options.documentRoot;
    var handler = options.handler;

    return function(req, res, next) {
        req.pause();
        
        var info = url.parse(req.url);
        var scriptName = info.pathname;
        var query = info.query;
        var method = req.method;
        var scriptFileName = path.normalize(docRoot + scriptName);

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
        for (var header in headers) {
            var name = 'HTTP_' + header.toUpperCase().replace(/-/g, '_');
            env[name] = headers[header];
        }
        if ('content-type' in headers) {
            env.CONTENT_TYPE = headers['content-type'];
        }
        if ('content-length' in headers) {
            env.CONTENT_LENGTH = headers['content-length'];
        }

        var child = require('child_process').spawn(
            handler || 'php-cgi',
            [],
            {
                env: env
            }
        );

        var buffer = [];

        child.on(
            'exit',
            function(code) {
                done(code);
            }
        );

        // collect data
        child.stdout.on('data', function(buf) {
            buffer.push(buf);
        });

        // pipe data into child progress
        // specially for post
        req.pipe(child.stdin);
        req.resume();

        function done(code) {
            var result = parse(buffer.join(''));

            result.headers.Status = result.headers.Status || "200 OK";
            result.statusCode = parseInt(result.headers.Status, 10); 

            next(code, result);
        }
    };
}
