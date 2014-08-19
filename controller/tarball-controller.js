var url = require('url');
var fs = require('fs');
var path = require('path');
var sync = require(__dirname + '/../service/sync');
var config = require(__dirname + '/../lib/config');
var proxy = require(__dirname + '/../lib/proxy');
var registry = config.get('registry');
var cacheDir = path.resolve(process.cwd(), config.get('cache'));

module.exports = function(req, res){
  var file = url.resolve(registry, req.url);
  var cachedFile = path.resolve(cacheDir, 'pkg_' + req.params.filename);
  fs.exists(cachedFile, function(exists){
    if(!exists){
      sync.emit('sync', 'pkg', req.params.filename, file);
      res.setHeader('x-mirror-from', file);
      return proxy(req, res);
    }

    res.setHeader('x-mirror-from', 'cache');
    fs.createReadStream(cachedFile).pipe(res);
  });
};
