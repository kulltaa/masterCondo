const Joi = require('joi');

module.exports = {

  /**
   * Validation schema for creating user
   *
   * @return {Object}
   */
  createSchema() {
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
        username: Joi.string().regex(/^[\w-_.]+$/, 'username').required()
          .options({
            language: {
              string: {
                regex: {
                  name: 'can only contain 0-9, a-z, A-Z, -, _, .'
                }
              }
            }
          }),
        password: Joi.string().min(8).required(),
        password_confirmation: Joi.any().valid(Joi.ref('password')).required()
          .options({
            language: {
              any: {
                allowOnly: 'must match password'
              }
            }
          })
      });
  },

  /**
   * Validation schema for user login
   *
   * @return {Object}
   */
  loginSchema() {
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
        email: Joi.string().email().required()
          .options({
            language: {
              any: {
                empty: '!!Please check your email/password again'
              },
              string: {
                email: '!!Please check your email/password again'
              }
            }
          }),
        password: Joi.string().required()
          .options({
            language: {
              any: {
                empty: '!!Please check your email/password again'
              }
            }
          })
      });
  },

  /**
   * Verify email
   *
   * @return {Object}
   */
  verifySchema() {
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
        token: Joi.string().required()
      });
  },

  /**
   * Forgot schema
   *
   * @return {Object}
   */
  forgotSchema() {
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
        email: Joi.string().email().required()
      });
  },

  /**
   * Validate forgot params schema
   *
   * @return {Object}
   */
  validateForgotParamsSchema() {
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
        token: Joi.string().required()
      });
  }
};
