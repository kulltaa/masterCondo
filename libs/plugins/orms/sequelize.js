const Sequelize = require('sequelize');
const HapiSequelize = require('hapi-sequelize');
const utils = require('../../helpers/utils');

const MYSQL_HOST = utils.getEnv('MYSQL_HOST');
const MYSQL_PORT = utils.getEnv('MYSQL_PORT');
const MYSQL_USERNAME = utils.getEnv('MYSQL_USERNAME');
const MYSQL_PASSWORD = utils.getEnv('MYSQL_PASSWORD');
const MYSQL_DBNAME = utils.getEnv('MYSQL_DBNAME');
const MYSQL_ENGINE = utils.getEnv('MYSQL_ENGINE');
const MYSQL_CHARSET = utils.getEnv('MYSQL_CHARSET');

const sequelize = new Sequelize(MYSQL_DBNAME, MYSQL_USERNAME, MYSQL_PASSWORD, {
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  dialect: 'mysql',
  engine: MYSQL_ENGINE,
  charset: MYSQL_CHARSET,
  logging: utils.env() !== 'production'
});

module.exports = {
  register: HapiSequelize,
  options: {
    sequelize,
    name: MYSQL_DBNAME,
    models: ['./api/models/**/*.js'],
    sync: false,
    debug: utils.env() !== 'production'
  }
};
