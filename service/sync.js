var async = require('async');
var https = require('https');
var fs = require('fs');
var events = require('events');
var config = require(__dirname + '/../lib/config');
var log = require(__dirname + '/../lib/log');
var lockfile = require('lockfile');
var comm = new events.EventEmitter();
var path = require('path');

var finish = function(file, job, cb){
  fs.rename(file + '.tmp', file, function(err){
    if(err){
      log.error('Failed to rename .tmp sync');
      log.error(err.stack);
    }

    lockfile.unlock(file + '.lock', function(err){
      if(err){
        log.error('Failed to unlock sync');
        log.error(err.stack);
      } else
        log.info('File ' + job.name + ' successfully synced.');

      cb();
    });
  });
};

var queue = async.queue(function(job, cb){
  var file = path.resolve(process.cwd(), config.get('cache'), job.type +
    '_' + job.name);

  lockfile.lock(file + '.lock', function(err){
    if(err){
      log.error('Failed to get sync lock');
      log.error(err.stack);
      return cb();
    }

    if(job.data){
      fs.writeFile(file + '.tmp', job.data, finish.bind(null, file, job, cb));
    } else
      https.get(job.url, function(res){
        if(res.statusCode !== 200)
          return log.info('Not 200 when syncing ' + job.name + ': ' +
            res.statusCode);

        var writer = fs.createWriteStream(file + '.tmp');

        writer.on('finish', function(){
          finish(file, job, cb);
        });

        res.pipe(writer);
      }).on('error', function(err){
        log.error('Failed sync job');
        log.error(err.stack);
        return cb();
      });
  });
}, https.globalAgent.maxSockets);

module.exports = comm;

comm.on('sync', function(type, name, url, data){
  queue.push({
    type: type,
    name: name,
    url: url,
    data: data
  });
});
