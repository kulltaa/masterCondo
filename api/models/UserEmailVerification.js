const crypto = require('crypto');
const _ = require('lodash');
const moment = require('moment');
const utils = require('../../libs/helpers/utils');

const emailSubject = 'Verify Account';
const emailTemplate = _.template(
  'Hello\n' +
  'Please click on the link to verify your email.\n' +
  '<a href=<%= verificationUrl %>>Click here to verify</a>'
);
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
        getToken() {
          return this.getDataValue('token');
        },

        /**
         * Get token expired
         *
         * @return {Date}
         */
        getTokenExpiredAt() {
          return this.getDataValue('token_expired_at');
        },

        /**
         * Get email
         *
         * @return {String}
         */
        getEmail() {
          return this.getDataValue('email');
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
         * Create new email verification token
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
         * Build verification url
         *
         * @param {String} email
         * @param {String} token
         * @return {String}
         */
        buildVerificationUrl(email, token) {
          const baseUrl = utils.getBaseUrl();
          const encodedEmail = encodeURIComponent(email);
          const encodedToken = encodeURIComponent(token);

          return `${baseUrl}/users/verify?email=${encodedEmail}&token=${encodedToken}`;
        },

        /**
         * Create email verification payload
         *
         * @param {String} baseUrl
         * @param {String} email
         * @param {String} token
         * @return {{to: String, subject: String, html: String}}
         */
        createEmailVerificationPayload(email, token) {
          const verificationUrl = this.buildVerificationUrl(email, token);

          const emailPayload = {
            to: email,
            subject: emailSubject,
            html: emailTemplate({ verificationUrl })
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

        /**
         * Validate email & token
         *
         * @param {String} token
         * @param {String} email
         * @return {{isValid: Boolean, isExpired: Boolean}}
         */
        validate(email, token) {
          return this.findByToken(token)
            .then((result) => {
              if (!result) {
                return { isValid: false };
              }

              const expiredAt = result.getTokenExpiredAt();
              if (moment(expiredAt).isBefore(moment())) {
                return { isExpired: true };
              }

              const verifiedEmail = result.getEmail();
              if (email !== verifiedEmail) {
                return { isValid: false };
              }

              return {};
            })
            .catch(error => Promise.reject(error));
        }
      }
    }
  );

  return UserEmailVerification;
};
