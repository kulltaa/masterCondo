const crypto = require('crypto');
const moment = require('moment');
const utils = require('../../libs/helpers/utils');

const ACCESS_TOKEN_LIFE_TIME = Number(utils.getEnv('ACCESS_TOKEN_LIFE_TIME'));

module.exports = function createUserModel(sequelize, DataTypes) {
  const UserAccessToken = sequelize.define(
    'UserAccessToken',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      access_token: {
        type: DataTypes.STRING,
        allowNull: false
      },
      access_token_expired_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      tableName: 'user_access_token',
      underscored: true,
      instanceMethods: {

        /**
         * Get token value
         *
         * @return {String}
         */
        getToken() {
          return this.getDataValue('access_token');
        },

        /**
         * Get token expired
         *
         * @return {Date}
         */
        getTokenExpiredAt() {
          return this.getDataValue('access_token_expired_at');
        },

        /**
         * Get access token status
         *
         * @return {Boolean}
         */
        getStatus() {
          return this.getDataValue('is_active');
        }
      },
      classMethods: {
        associate(models) {
          UserAccessToken.belongsTo(models.User);
        },

        /**
         * Generate access token
         *
         * @return {{value: String, expired: Date}}
         */
        genToken() {
          try {
            const buff = crypto.randomBytes(256);
            const tokenValue = crypto.createHash('sha1').update(buff).digest('hex');
            const tokenExpired = moment().utc().add(ACCESS_TOKEN_LIFE_TIME, 'seconds').toDate();

            return {
              value: tokenValue,
              expired: tokenExpired
            };
          } catch (e) {
            throw e;
          }
        },

        /**
         * Find by access token
         *
         * @param {String} token
         * @return {Promise}
         */
        findByUserId(userId) {
          const UserModel = sequelize.model('User');

          const cond = {
            where: {
              user_id: userId
            },
            include: [
              {
                model: UserModel,
                required: true
              }
            ]
          };

          return this.findOne(cond);
        },

        /**
         * Find by access token
         *
         * @param {String} token
         * @return {Promise}
         */
        findByToken(token) {
          const UserModel = sequelize.model('User');

          const cond = {
            where: {
              access_token: token
            },
            include: [
              {
                model: UserModel,
                required: true
              }
            ]
          };

          return this.findOne(cond);
        },

        // findAndValidateToken(token, callback) {
        //   return this.findByToken(token)
        //     .then((tokenRecord) => {
        //       const result = UserAccessToken.validate(tokenRecord);
        //
        //       const { isValid, isExpired } = result;
        //       if (!isValid) {
        //         return callback(null, { isValid: false });
        //       }
        //
        //       if (isExpired) {
        //         return callback(null, { isValid: true, isExpired: true });
        //       }
        //
        //       return callback(null, { credentials: { user: tokenRecord.User } });
        //     })
        //     .catch(error => callback(error));
        // },

        /**
         * validateAccessToken
         *
         * @param {String} token
         * @param {Function} callback
         */
        validate(tokenRecord) {
          try {
            if (!tokenRecord) {
              return { isValid: false };
            }

            const isActive = tokenRecord.getStatus();
            if (!isActive) {
              return { isValid: false };
            }

            const expiredAt = tokenRecord.getTokenExpiredAt();
            if (moment(expiredAt).isBefore(moment())) {
              return { isValid: true, isExpired: true };
            }

            return { isValid: true, isExpired: false };
          } catch (e) {
            return { isValid: false };
          }
        },

        /**
         * Create new access token for user
         *
         * @param {Int} userId
         * @return {Promise}
         */
        createNewAccessToken(userId) {
          const token = this.genToken();
          const payload = {
            access_token: token.value,
            access_token_expired_at: token.expired,
            user_id: userId
          };

          return this.create(payload)
            .then(() => token.value)
            .catch(error => Promise.reject(error));
        },

        /**
         * Invalidate token
         *
         * @param {Int} userId
         * @return {Promise}
         */
        invalidateTokenByUserId(userId) {
          return this.update(
            { is_active: false },
            { where: { user_id: userId } }
          );
        }
      }
    }
  );

  return UserAccessToken;
};
