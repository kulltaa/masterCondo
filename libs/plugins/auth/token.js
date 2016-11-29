const AuthBearer = require('hapi-auth-bearer-token');

const AUTH_NAME = 'auth-access-token';
const AUTH_SCHEME = 'bearer-access-token';

/**
 * Validate access token
 *
 * @param {String} token
 * @param {Function} callback
 * @return {Promise}
 */
const validateAccessToken = function validateAccessToken(token, callback) {
  const request = this;
  const User = request.getDb().getModel('User');
  const UserAccessToken = request.getDb().getModel('UserAccessToken');

  UserAccessToken
    .isAccessTokenValid(token, User)
    .then((result) => {
      if (!result) {
        callback(null, false);

        return Promise.resolve();
      }

      callback(null, true, result.User);

      return Promise.resolve();
    })
    .catch((error) => {
      request.log('error', error);

      callback(null, false);

      return Promise.resolve();
    });
};

module.exports = {
  name: AUTH_NAME,
  scheme: AUTH_SCHEME,
  plugin: AuthBearer,
  options: {
    validateFunc: validateAccessToken
  }
};
