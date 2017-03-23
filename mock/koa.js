/**
 * @file koa example
 * @author hushicai(bluthcy@gmail.com)
 */

const Koa = require('koa');
const serve = require('koa-static');
const phpcgi = require('../koa');
const app = new Koa();

var documentRoot = require('path').resolve(__dirname, '..');

app.use(phpcgi({documentRoot: documentRoot}));
app.use(serve(documentRoot));

app.listen(4000);

console.log('listening on port 4000');
