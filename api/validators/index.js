const fs = require('fs');
const path = require('path');

const validators = {};

fs
  .readdirSync(__dirname)
  .filter(file => file.indexOf('.') !== 0 && file !== 'index.js')
  .forEach((file) => {
    const validator = require(path.join(__dirname, file)); // eslint-disable-line
    const name = path.basename(file, '.js');

    validators[name] = validator;
  });

module.exports = validators;
