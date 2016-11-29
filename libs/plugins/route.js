const routes = require('../../api/routes');

exports.register = function registerRoute(server, options, next) {
  server.route(routes);

  next();
};

exports.register.attributes = {
  name: 'route',
  version: '0.0.1',
  multiple: false,
  dependencies: ['auth']
};
