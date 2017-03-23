var serveStatic = require('serve-static');
var serveIndex = require('serve-index');
var phpcgi = require('../index');

var express = require('express');
var app = express();

app.set('port', 8000);

var documentRoot = require('path').resolve(__dirname, '..');

app.use(phpcgi({documentRoot: documentRoot}));
app.use(serveIndex(documentRoot));
app.use(serveStatic(documentRoot));

app.listen(
  app.get('port'),
  function() {
    console.log('Express server listening on port ' + app.get('port'));
  }
);
