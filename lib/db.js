(function() {
    'use strict';

    var define = require('amdefine')(module);

    var deps = [
        'deferred',
        'fs',
        '../config',
        'sqlite3',
        'path',

        '../logger'
    ];

    define(deps, function(deferred, fs, config, sqlite3, path, Logger) {
        sqlite3.verbose();
        var d = deferred();
        var db = new sqlite3.Database(config.db.sqlite.name, function(err) {
          if (err) {
            d.reject(err);
          }
        });

        module.exports = function () {

            Logger.log('Initializing db integrations.');

            var self = this;
            var readdir = deferred.promisify(fs.readdir);
            readdir(__dirname + 'db')
                .map(function (file) {
                    // Only load .js files in the current directory, do not recurse
                    // sub-directories, do not include index.js
                    if (file.match(/^.+\.js$/g)) {
                        var filePath = path.join(__dirname, file);
                        Logger.info('Loading ' + filePath);
                        return require(filePath)(db);
                    }
                })
                .then(d.resolve, function (err) {
                    Logger.error(err);
                    Logger.error(err.stack);
                });

            return d.promise();
        }
    })
}());
