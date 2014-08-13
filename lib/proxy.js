var httpProxy = require('http-proxy');
var Routes = require('routes');
var fs = require('fs');
var url = require('url');
var path = require('path');
var config = require(__dirname + '/config');
var log = require(__dirname + '/log');
var request = require('request');
var registry = config.get('registry');
var sync = require(__dirname + '/../service/sync');
var patchJSON = require(__dirname + '/patchJSON');
var proxyHost = url.parse(registry);
var localUrl = url.parse(config.get('url'));
var cacheDir = path.resolve(process.cwd(), config.get('cache'));
var proxy = httpProxy.createProxyServer({});
var router = new Routes();

proxy.on('proxyReq', function(req){
  req.setHeader('host', proxyHost.host);
});

var proxyHandler = function(req, res){
  return proxy.web(req, res, {target: registry});
};

var getMeta = function(pkg, file, req, res){
  request.get(file, function(err, head, body){
    if(err)
      throw err;

    if(head.statusCode !== 200)
      return res.status(head.statusCode).send(body);

    var patched = patchJSON(body);
    sync.emit('sync', 'meta', pkg, file, JSON.stringify(patched));

    res.setHeader('x-mirror-from', file);
    res.json(patched);
  });
};

router.addRoute('/:meta', function(req, res){
  var file = url.resolve(registry, req.params.meta);
  var cachedFile = path.resolve(cacheDir, 'meta_' + req.params.meta);
  fs.stat(cachedFile, function(err, stat){
    if(err){
      console.error('Failed to stat meta');
      console.error(err.stack);
      sync.emit('sync', 'meta', req.params.meta, file);
      return getMeta(req.params.meta, file, req, res);
    }

    if(new Date().getTime() - stat.ctime.getTime() > 3600000)
      return getMeta(req.params.meta, file, req, res);

    res.setHeader('content-type', 'application/json');
    res.setHeader('x-mirror-from', 'cache');
    fs.createReadStream(cachedFile).pipe(res);
  });
});

router.addRoute('/:package/-/:filename', function(req, res){
  var file = url.resolve(registry, req.url);
  var cachedFile = path.resolve(cacheDir, 'pkg_' + req.params.filename);
  fs.exists(cachedFile, function(exists){
    if(!exists){
      sync.emit('sync', 'pkg', req.params.filename, file);
      res.setHeader('x-mirror-from', file);
      return proxyHandler(req, res);
    }

    res.setHeader('x-mirror-from', 'cache');
    fs.createReadStream(cachedFile).pipe(res);
  });
});

module.exports = function(req, res, next){
  if(req.headers.host &&
    req.headers.host.indexOf(localUrl.host) !== 0)
      return next();

  log.info('Proxing ' + req.headers.host + req.url);

  var route = router.match(req.url);
  if(!route)
    return proxyHandler(req, res);

  req.params = route.params;
  route.fn.apply(null, [req, res, route.next]);
};
