const UserController = require('../controllers/User');
const validators = require('../validators');

/**
 * Action handler for failed params
 *
 * @param {Object} request
 * @param {Object} reply
 * @param {String} source
 * @param {Object} error
 * @return {*}
 */
const failAction = function failAction(request, reply, source, error) {
  if (error.data && error.data.name === 'ValidationError') {
    return reply.badRequest(error);
  }

  return reply.continue();
};

module.exports = [
  {
    method: 'POST',
    path: '/users/register',
    config: {
      handler: UserController.create,
      description: 'Create new user',
      tags: ['api'],
      validate: {
        failAction,
        payload: validators.user.createSchema()
      }
    }
  },
  {
    method: 'POST',
    path: '/users/login',
    config: {
      handler: UserController.login,
      description: 'User login',
      tags: ['api'],
      validate: {
        failAction,
        payload: validators.user.loginSchema()
      }
    }
  },
  {
    method: 'GET',
    path: '/users/verify',
    config: {
      handler: UserController.verify,
      description: 'Verify email',
      tags: ['api'],
      validate: {
        failAction,
        query: validators.user.verifySchema()
      }
    }
  },
  {
    method: 'POST',
    path: '/users/recover',
    config: {
      handler: UserController.recover,
      description: 'Recover account',
      tags: ['api'],
      validate: {
        failAction,
        payload: validators.user.recoverSchema()
      }
    }
  },
  {
    method: 'GET',
    path: '/users/status',
    config: {
      auth: 'auth-access-token',
      handler: UserController.status,
      description: 'Get user status',
      tags: ['api']
    }
  }
];
