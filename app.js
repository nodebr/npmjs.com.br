var express = require('express');
var fs = require('fs');
var http = require('http');
var https = require('https');
var config = require(__dirname + '/lib/config');
var proxy = require(__dirname + '/lib/proxy');
var log = require(__dirname + '/lib/log');
var controller = require(__dirname + '/controller');
var app = express();

// Rotas principais
app.get('/:meta', controller['meta-controller']);
app.get('/:package/-/:filename', controller['tarball-controller']);
app.all('*', proxy);

// Configurações dos servidores http e https
var server = {
  http: http.Server(app),
  https: https.Server({
    key: fs.readFileSync(config.get('https.key')),
    cert: fs.readFileSync(config.get('https.cert'))
  }, app)
}

// Binfagem dos servidores http e https
server.http.listen(config.get('http.port'), function(err){
  if(err)
    throw err;

  log.info('Servidor http iniciado na porta ' + config.get('http.port') +
    ' no modo ' + config.get('mode'));
});

server.https.listen(config.get('https.port'), function(err){
  if(err)
    throw err;

  log.info('Servidor https iniciado na porta ' + config.get('https.port') +
    ' no modo ' + config.get('mode'));
});
