var http = require('http');
var phpcgi = require('../index');
var request = require('supertest');
var path = require('path');

var documentRoot = __dirname + '/htdocs',
    args = ['-c', '/usr/local/php/lib/php.ini'];

var cgi = phpcgi({
    documentRoot: documentRoot,
    args: args
});

var ticket = 'not handled by cgi!';

var app = http.createServer(function(req, res) {
    cgi(req, res, function(err) {
        res.writeHead(200);
        res.end(ticket);
    });
});

describe('phpcgi', function() {
    it('should return 200', function(done) {
        request(app)
            .get('/200.php')
            .expect(200)
            .end(done);
    });
    it('should return 404', function(done) {
        request(app)
            .get('/404.php')
            .expect(404)
            .end(done);
    });
    it('should return 302', function(done) {
        request(app)
            .get('/302.php')
            .expect(302)
            .end(done);
    });
    it('should response the body content hushicai', function(done) {
        request(app)
            .get('/content.php')
            .expect('hushicai')
            .end(done);
    });
    it('should return the query string', function(done) {
        var query = 'q=hello';
        request(app)
        .get('/query.php?' + query)
        .expect(query)
        .end(done);
    });
    it('should response post data', function(done) {
        request(app)
           .post('/post.php')
           .type('form')
           .set('user-agent', 'chrome')
           .set('referer', 'http://www.baidu.com')
           .send({name: 'hushicai'})
           .expect(200)
           .expect('hushicai')
           .end(done);
    });
    it('should ignore assets', function (done) {
         request(app)
            .get('/assets/rgb.png')
            .expect(200)
            .expect(ticket)
            .end(done);
    });
    it('extensions should be configurable', function(done) {
        var cgiCustom = phpcgi({
            documentRoot: documentRoot,
            args: args,
            extensions: ['.php', '.php5']
        });

        request(
           http.createServer(function(req, res) {
               cgiCustom(req, res, function(err) {});
           })
        )
        .get('/200.php5')
        .expect(200)
        .end(done);
    });
    it('include path should override extensions check', function(done) {
        var cgiCustom = phpcgi({
            documentRoot: documentRoot,
            args: args,
            includePath: '/assets'
        });

        request(
            http.createServer(function(req, res) {
                cgiCustom(req, res, function(err) {});
            })
        )
        .get('/assets/rgb.png')
        .expect(200)
        .end(done);
    });
    it('should support an entry point for application', function(done) {
        var cgiCustom = phpcgi({
            documentRoot: documentRoot,
            args: args,
            entryPoint: '/content.php'
        });

        request(
            http.createServer(function(req, res) {
                cgiCustom(req, res, function(err) {});
            })
        )
        .get('/not-existing.php')
        .expect('hushicai')
        .end(done);
    });
    it('should support entryPoint and includePath together (positive)', function(done) {
        var cgiCustom = phpcgi({
            documentRoot: documentRoot,
            args: args,
            includePath: '/api',
            entryPoint: '/content.php'
        });

        request(
            http.createServer(function(req, res) {
                cgiCustom(req, res, function(err) {});
            })
        )
        .get('/api/resource')
        .expect('hushicai')
        .end(done);
    });
    it('should support entryPoint and includePath together (negative)', function(done) {
        var cgiCustom = phpcgi({
            documentRoot: documentRoot,
            args: args,
            includePath: '/api',
            entryPoint: '/content.php'
        });

        request(
            http.createServer(function(req, res) {
                cgiCustom(req, res, function(err) {});

            })
        )
        .get('/not-existing');

        setTimeout(function(){
            done()
        }, 1500);
    });
});
