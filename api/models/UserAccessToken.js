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
         * Validate access token
         *
         * @param {String} token
         * @param {Sequelize.Model[]} includedModels
         * @return {Promise}
         */
        isAccessTokenValid(token, ...includedModels) {
          const cond = {
            where: {
              access_token: token,
              is_active: true,
              access_token_expired_at: {
                $gt: moment().utc().toDate()
              }
            }
          };

          if (includedModels) {
            cond.include = [];

            includedModels.forEach(model => (
              cond.include.push({ model, required: true })
            ));
          }

          return this.findOne(cond);
        }
      }
    }
  );

  return UserAccessToken;
};
