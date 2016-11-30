const Joi = require('joi');

module.exports = {

  /**
   * Validation schema for creating user
   *
   * @return {Object}
   */
  create() {
    return Joi
      .object()
      .options({
        language: {
          messages: {
            wrapArrays: false
          },
          object: {
            child: '!!{{reason}}'
          }
        }
      })
      .keys({
        email: Joi.string().email().required(),
        username: Joi.string().required(),
        password: Joi.string().min(8).required(),
        password_confirmation: Joi.any().valid(Joi.ref('password')).required()
          .options({
            language: {
              any: { allowOnly: 'must match password' }
            }
          })
      });
  }
};
