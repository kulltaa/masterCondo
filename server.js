require('dotenv').config();

const Hapi = require('hapi');

const plugins = require('./libs/plugins');
const utils = require('./libs/helpers/utils');

const APP_PORT = utils.getEnv('APP_PORT');

const server = new Hapi.Server();
server.connection({ port: APP_PORT });

server.register(plugins, (onRegisteredPluginsError) => {
  if (onRegisteredPluginsError) {
    throw onRegisteredPluginsError;
  }

  server.start((onStartedServerError) => {
    if (onStartedServerError) {
      throw onStartedServerError;
    }

    server.log('info', `Server is running on port ${APP_PORT}`);
  });
});
