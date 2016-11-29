const fs = require('fs');
const path = require('path');

let plugins = [];

fs.readdirSync(__dirname)
  .filter(file => (
    file.indexOf('.') !== 0 &&
    file !== 'index.js' &&
    file !== 'auth' &&
    file !== 'orms' &&
    file !== 'responses'
  ))
  .forEach((file) => {
    const plugin = require(path.join(__dirname, file)); // eslint-disable-line
    plugins = plugins.concat(plugin);
  });

module.exports = plugins;
