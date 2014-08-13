var url = require('url');
var config = require(__dirname + '/config');
var localUrl = url.parse(config.get('url'));

module.exports = function(json){
  if(typeof json === 'string')
    json = JSON.parse(json);

  Object.keys(json.versions).forEach(function(version){
    var tar = url.parse(json.versions[version].dist.tarball);

    json.versions[version].dist.tarball =
      url.resolve(localUrl.protocol + '//' + localUrl.host, tar.path);
  });

  return json;
};
