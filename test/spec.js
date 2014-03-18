var http = require('http');
var phpcgi = require('../main');
var request = require('supertest');

var middleware = phpcgi({
    documentRoot: __dirname + '/htdocs',
    handler: '/usr/local/php2/bin/php-cgi'
});

var app = http.createServer(function(req, res) {
    middleware(req, res, function(err) {});
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
        var query = 'q=hello'
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
});
