const crypto = require('crypto');
const _ = require('lodash');
const moment = require('moment');
const utils = require('../../libs/helpers/utils');

const emailSubject = 'Recover Account';
const emailTemplate = _.template(
  'Hello\n' +
  'Please click on the link to recover your account.\n' +
  '<a href=<%= recoveryUrl %>>Click here to recover</a>'
);
const EMAIL_RECOVERY_TOKEN_LIFE_TIME = Number(utils.getEnv('EMAIL_RECOVERY_TOKEN_LIFE_TIME'));

module.exports = function createUserModel(sequelize, DataTypes) {
  const UserRecovery = sequelize.define(
    'UserRecovery',
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
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      tableName: 'user_recovery',
      underscored: true,
      instanceMethods: {

        /**
         *
         *
         *
         */
        getEmail() {
          return this.getDataValue('email');
        },

        /**
         * Get token value
         *
         * @return {String}
         */
        getToken() {
          return this.getDataValue('token');
        },

        /**
         * Get token expired at
         *
         * @return {Date}
         */
        getTokenExpiredAt() {
          return this.getDataValue('token_expired_at');
        },

        /**
         * Get link status
         *
         * @return {Boolean}
         */
        getStatus() {
          return this.getDataValue('is_active');
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
            const tokenExpired = moment().utc().add(EMAIL_RECOVERY_TOKEN_LIFE_TIME, 'seconds').toDate();

            return {
              value: tokenValue,
              expired: tokenExpired
            };
          } catch (e) {
            throw e;
          }
        },

        /**
         * Create new recovery token
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
         * Build verification url
         *
         * @param {String} token
         * @return {String}
         */
        buildRecoveryUrl(token) {
          const baseUrl = utils.getBaseUrl();
          const encodedToken = encodeURIComponent(token);

          return `${baseUrl}/users/recover?token=${encodedToken}`;
        },

        /**
         * Create email verification payload
         *
         * @param {String} baseUrl
         * @param {String} email
         * @param {String} token
         * @return {{to: String, subject: String, html: String}}
         */
        createEmailRecoveryPayload(email, token) {
          const recoveryUrl = this.buildRecoveryUrl(token);

          const emailPayload = {
            to: email,
            subject: emailSubject,
            html: emailTemplate({ recoveryUrl })
          };

          return emailPayload;
        },

        /**
         * Find and validate token
         *
         * @param {String} token
         * @return {{isValid: Boolean, isExpired: Boolean}}
         */
        findAndValidateToken(token) {
          return this.findByToken(token)
            .then(result => this.validate(result))
            .catch(error => Promise.reject(error));
        },

        /**
         * Validate token record
         *
         * @param {Object} tokenRecord
         * @return {{isValid: Boolean, isExpired: Boolean}}
         */
        validate(tokenRecord) {
          try {
            if (!tokenRecord) {
              return { isValid: false };
            }

            const status = tokenRecord.getStatus();
            if (!status) {
              return { isValid: false };
            }

            const expiredAt = tokenRecord.getTokenExpiredAt();
            if (moment(expiredAt).isBefore(moment())) {
              return { isExpired: true };
            }

            return { isValid: true, isExpired: false };
          } catch (e) {
            return { isValid: false };
          }
        }
      }
    }
  );

  return UserRecovery;
};
