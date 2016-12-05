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
        getValue() {
          return this.getDataValue('access_token');
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
        findByToken(token) {
          const UserModel = sequelize.model('User');

          const cond = {
            where: {
              access_token: token,
              // is_active: true,
              // access_token_expired_at: {
              //   $gt: moment().utc().toDate()
              // }
            },
            include: [
              {
                model: UserModel,
                required: true
              }
            ]
          };

          // if (includedModels.length) {
          //   cond.include = [];
          //
          //   includedModels.forEach(model => (
          //     cond.include.push({ model, required: true })
          //   ));
          // }

          return this.findOne(cond);
        },

        /**
         * validateAccessToken
         *
         * @param {String} token
         * @param {Function} callback
         */
        validateAccessToken(token, callback) {
          return this.findByToken(token)
            .then((result) => {
              if (!result) {
                return callback(null, { isValid: false });
              }

              const isActive = result.is_active;
              if (!isActive) {
                return callback(null, { isValid: false });
              }

              const expiredAt = result.access_token_expired_at;
              if (moment(expiredAt).isBefore(moment())) {
                return callback(null, { isExpired: true });
              }

              const user = result.User;
              return callback(null, { credentials: { user } });
            })
            .catch(error => callback(error));
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

          return this.create(payload);
        }
      }
    }
  );

  return UserAccessToken;
};
