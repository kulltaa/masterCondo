const Hoek = require('hoek');

const TOKEN_TYPE = 'Bearer';

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

      callback(null, true, { user: result.User });

      return Promise.resolve();
    })
    .catch((error) => {
      request.log('error', error);

      callback(null, false);

      return Promise.resolve();
    });
};


const internals = {};

internals.implementation = (server, options) => {
  Hoek.assert(options, 'Missing bearer auth strategy options');

  const scheme = {
    authenticate(request, reply) {
      const authorization = request.raw.req.headers.authorization;

      if (!authorization) {
        return reply.unauthorized(new Error('An access token is required to request this resource.'));
      }

      const parts = authorization.split(/\s+/);

      if (parts[0].toLowerCase() !== TOKEN_TYPE.toLowerCase()) {
        return reply.unauthorized(new Error('An access token is required to request this resource.'));
      }

      const token = parts[1];

      return options.validateFunc.call(request, token, (error, isValid, credentials) => {
        if (error) {
          return reply.serverError(error);
        }

        if (!isValid) {
          return reply.unauthorized(new Error('An access token is required to request this resource.'));
        }

        if (!credentials || typeof credentials !== 'object') {
          return reply.serverError(new Error('Bad token string received for Bearer auth validation'));
        }

        return reply.continue({ credentials });
      });
    }
  };

  return scheme;
};

exports.register = function registerAuthBearerAccessToken(server, options, next) {
  server.auth.scheme('bearer-access-token', internals.implementation);
  server.auth.strategy(
    'auth-access-token',
    'bearer-access-token',
    {
      validateFunc: validateAccessToken
    }
  );
  next();
};

exports.register.attributes = {
  name: 'bearer-access-token',
  version: '0.0.1',
  multiple: false
};
