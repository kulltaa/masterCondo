const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');

/**
 * Register db plugin by file
 *
 * @param {Object} server
 * @param {String} file
 * @return {Promise}
 */
const registerDbByFile = function registerDbByFile(server, file) {
  return new Promise((resolve, reject) => {
    const orm = require(path.join(__dirname, 'orms', file)); // eslint-disable-line

    server.register(orm, (error) => {
      if (error) {
        return reject(error);
      }

      return resolve();
    });
  });
};

exports.register = function registerDb(server, options, next) {
  const files = fs
    .readdirSync(path.join(__dirname, 'orms'))
    .filter(file => file.indexOf('.') !== 0);

  Promise.map(files, file => registerDbByFile(server, file))
    .then(() => {
      next();

      return Promise.resolve();
    })
    .catch((error) => {
      next(error);

      return Promise.resolve();
    });
};

exports.register.attributes = {
  name: 'db',
  version: '0.0.1',
  multiple: false
};
