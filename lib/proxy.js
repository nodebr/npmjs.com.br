var httpProxy = require('http-proxy');
var config = require(__dirname + '/config');
var url = require('url');
var proxy = httpProxy.createProxyServer({});
var registry = config.get('registry');
var proxyHost = url.parse(registry);

proxy.on('proxyReq', function(req){
  req.setHeader('host', proxyHost.host);
});

module.exports = function(req, res){
  return proxy.web(req, res, {target: registry});
};
