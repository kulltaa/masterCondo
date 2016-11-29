const good = require('good');
const utils = require('../helpers/utils');

const options = {
  reporters: {
    console: [
      {
        module: 'good-squeeze',
        name: 'Squeeze',
        args: [
          {
            log: '*',
            request: '*'
          }
        ]
      },
      {
        module: 'good-console'
      },
      'stdout'
    ],
    file: [
      {
        module: 'good-squeeze',
        name: 'Squeeze',
        args: [
          {
            log: 'error',
            error: '*'
          }
        ]
      },
      {
        module: 'good-squeeze',
        name: 'SafeJson'
      },
      {
        module: 'good-file',
        args: [utils.getEnv('LOG_PATH')]
      }
    ]
  }
};

module.exports = {
  register: good,
  options
};
