var express = require('express');
var config = require(__dirname + '/lib/config');
var log = require(__dirname + '/lib/log');
var app = express();

app.use(require(__dirname + '/lib/proxy'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/view/index.html');
});

app.listen(config.get('port'), function(err){
  if(err)
    throw err;

  log.info('Servidor iniciado na porta ' + config.get('port') + ' no modo ' +
    config.get('mode'));
});
