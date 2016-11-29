const fs = require('fs');
const path = require('path');

let routes = [];

fs.readdirSync(__dirname)
  .filter(file => file.indexOf('.') !== 0 && file !== 'index.js')
  .forEach((file) => {
    const route = require(path.join(__dirname, file));  // eslint-disable-line
    routes = routes.concat(route);
  });

module.exports = routes;
