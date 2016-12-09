const Hoek = require('hoek');

const AUTH_NAME = 'auth-access-token';
const AUTH_SCHEME = 'bearer-access-token';
const TOKEN_TYPE = 'Bearer';

/**
 * Validate access token
 *
 * @param {String} token
 * @param {Function} callback
 * @return {undefined}
 */
const validateAccessToken = function validateAccessToken(token, callback) {
  const request = this;
  const UserAccessTokenModel = request.getDb().getModel('UserAccessToken');

  return UserAccessTokenModel.validateAccessToken(token, callback);
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

      return options.validateFunc.call(request, token, (error, result) => {
        if (error) {
          return reply.serverError(error);
        }

        if (result.isValid !== undefined && result.isValid === false) {
          return reply.unauthorized(new Error('Invalid access token'));
        }

        if (result.isExpired !== undefined && result.isExpired) {
          return reply.unauthorized(new Error('Token is expired'));
        }

        const credentials = result.credentials;
        if (!credentials || typeof credentials !== 'object') {
          return reply.serverError(new Error('Bad token string received for Bearer auth validation'));
        }

        return reply.continue({ credentials });
      });
    }
  };

  return scheme;
};

const register = function registerAuthBearerAccessToken(server, options, next) {
  server.auth.scheme(AUTH_SCHEME, internals.implementation);
  server.auth.strategy(AUTH_NAME, AUTH_SCHEME, options);
  next();
};

register.attributes = {
  name: 'auth-access-token',
  version: '0.0.1',
  multiple: false
};

module.exports = {
  register,
  options: {
    validateFunc: validateAccessToken
  }
};
