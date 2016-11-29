const fs = require('fs');
const path = require('path');

exports.register = function registerResponse(server, options, next) {
  const files = fs
    .readdirSync(path.join(__dirname, 'responses'))
    .filter(file => file.indexOf('.') !== 0);

  files.forEach((file) => {
    const res = require(path.join(__dirname, 'responses', file)); // eslint-disable-line
    server.decorate('reply', res.method, res.handler);
  });

  next();
};

exports.register.attributes = {
  name: 'response',
  version: '0.0.1',
  multiple: false
};
