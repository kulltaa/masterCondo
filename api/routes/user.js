const UserController = require('../controllers/User');
const validators = require('../validators');

module.exports = [
  {
    method: 'POST',
    path: '/users',
    config: {
      handler: UserController.create,
      description: 'Create new user',
      tags: ['api'],
      validate: {
        payload: validators.user.create(),

        failAction(request, reply, source, error) {
          if (error.isBoom) {
            const message = error.output.payload.message;

            return reply.badRequest({ message });
          }

          return reply.continue();
        }
      }
    }
  }
];
