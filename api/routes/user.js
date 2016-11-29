const Joi = require('joi');
const UserController = require('../controllers/User');

module.exports = [
  {
    method: 'POST',
    path: '/users',
    config: {
      handler: UserController.create,
      description: 'Create new user',
      tags: ['api'],
      validate: {
        payload: {
          email: Joi.string().email(),
          username: Joi.string().min(3).required(),
          password: Joi.string().min(8).required()
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/users/login',
    handler: UserController.login
  },
  {
    method: 'GET',
    path: '/users',
    handler: UserController.all,
    // config: {
    //   auth: 'auth-access-token'
    // }
  }
];
