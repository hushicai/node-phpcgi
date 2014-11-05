var serveStatic = require('serve-static');
var serveIndex = require('serve-index');
var bodyParser = require('body-parser');
var phpcgi = require('./main');

var express = require('express');
var app = express();

app.set('port', 8000);

app.use(bodyParser.raw());
app.use(phpcgi({documentRoot: __dirname}));
app.use(serveIndex(__dirname));
app.use(serveStatic(__dirname));

app.listen(
    app.get('port'),
    function() {
        console.log('Express server listening on port ' + app.get('port'));
    }
);
