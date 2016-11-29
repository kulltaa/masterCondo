const Mailer = require('../../api/services/Mailer');

exports.register = function registerMailer(server, options, next) {
  server.method('services.mailer.send', Mailer.send);

  next();
};

exports.register.attributes = {
  name: 'mailer',
  version: '0.0.1',
  multiple: false
};
