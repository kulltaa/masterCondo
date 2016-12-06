const crypto = require('crypto');
const moment = require('moment');
const utils = require('../../libs/helpers/utils');

const EMAIL_VERIFICATION_TOKEN_LIFE_TIME = Number(utils.getEnv('EMAIL_VERIFICATION_TOKEN_LIFE_TIME'));

module.exports = function createUserModel(sequelize, DataTypes) {
  const UserEmailVerification = sequelize.define(
    'UserEmailVerification',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      email: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false
      },
      token_expired_at: {
        type: DataTypes.DATE,
        allowNull: false
      }
    },
    {
      tableName: 'user_email_verification',
      underscored: true,
      instanceMethods: {

        /**
         * Get token value
         *
         * @return {String}
         */
        getValue() {
          return this.getDataValue('token');
        },

        /**
         * Get token expired
         *
         * @return {Date}
         */
        getTokenExpiredAt() {
          return this.getDataValue('token_expired_at');
        }
      },
      classMethods: {

        /**
         * Generate token
         *
         * @return {{value: String, expired: Date}}
         */
        genToken() {
          try {
            const buff = crypto.randomBytes(256);
            const tokenValue = crypto.createHash('sha1').update(buff).digest('hex');
            const tokenExpired = moment().utc().add(EMAIL_VERIFICATION_TOKEN_LIFE_TIME, 'seconds').toDate();

            return {
              value: tokenValue,
              expired: tokenExpired
            };
          } catch (e) {
            throw e;
          }
        },

        /**
         * Create new access token for user
         *
         * @param {String} email
         * @return {Promise}
         */
        createNewToken(email) {
          const token = this.genToken();
          const payload = {
            token: token.value,
            token_expired_at: token.expired,
            email
          };

          return this.create(payload)
            .then(() => token.value)
            .catch(error => Promise.reject(error));
        },

        /**
         * Create email verification payload
         *
         * @param {String} baseUrl
         * @param {String} email
         * @param {String} token
         * @return {{to: String, subject: String, html: String}}
         */
        createEmailVerificationPayload(baseUrl, email, token) {
          const encodedEmail = encodeURIComponent(email);
          const verificationUrl = `${baseUrl}/user/verify/${encodedEmail}/${token}`;

          const emailPayload = {
            to: email,
            subject: 'Verify account',
            html: `Hello,
              Please click on the link to verify your email.
              <a href=${verificationUrl}>Click here to verify</a>`
          };

          return emailPayload;
        },

        /**
         * Find by email
         *
         * @param {String} email
         * @return {Promise}
         */
        findByEmail(email) {
          const cond = {
            where: { email }
          };

          return this.findOne(cond);
        },

        /**
         * Find by token
         *
         * @param {String} token
         * @return {Promise}
         */
        findByToken(token) {
          const cond = {
            where: { token }
          };

          return this.findOne(cond);
        },

        validateToken(token) {
          return this.findByToken(token)
            .then((result) => {
              if (!result) {
                return { isValid: false };
              }

              const expiredAt = result.getTokenExpiredAt();
              if (moment(expiredAt).isBefore(moment())) {
                return { isExpired: true };
              }

              return { email: result.email };
            })
            .catch(error => Promise.reject(error));
        }
      }
    }
  );

  return UserEmailVerification;
};
