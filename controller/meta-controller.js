var url = require('url');
var fs = require('fs');
var path = require('path');
var request = require('request');
var sync = require(__dirname + '/../service/sync');
var config = require(__dirname + '/../lib/config');
var log = require(__dirname + '/../lib/log');
var patchMeta = require(__dirname + '/../lib/patch-meta');
var registry = config.get('registry');
var cacheDir = path.resolve(process.cwd(), config.get('cache'));

module.exports = function(req, res){
  var file = url.resolve(registry, req.params.meta);
  var cachedFile = path.resolve(cacheDir, 'meta_' + req.params.meta);
  fs.stat(cachedFile, function(err, stat){
    if(err){
      log.error('Failed to stat meta ' + req.params.meta);
      log.error(err.stack);
      return getMeta(req.params.meta, file, req, res);
    }

    if(new Date().getTime() - stat.ctime.getTime() > 3600000)
      return getMeta(req.params.meta, file, req, res);

    res.setHeader('content-type', 'application/json');
    res.setHeader('x-mirror-from', 'cache');
    fs.createReadStream(cachedFile).pipe(res);
  });
};

var getMeta = function(pkg, file, req, res){
  request.get(file, function(err, head, body){
    if(err)
      throw err;

    if(head.statusCode !== 200)
      return res.status(head.statusCode).send(body);

    var patched = patchMeta(body);
    sync.emit('sync', 'meta', pkg, file, JSON.stringify(patched));

    res.setHeader('x-mirror-from', file);
    res.json(patched);
  });
};
