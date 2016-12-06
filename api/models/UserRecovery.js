const crypto = require('crypto');
const moment = require('moment');
const utils = require('../../libs/helpers/utils');

const EMAIL_VERIFICATION_TOKEN_LIFE_TIME = Number(utils.getEnv('EMAIL_VERIFICATION_TOKEN_LIFE_TIME'));

module.exports = function createUserModel(sequelize, DataTypes) {
  const UserEmailVerification = sequelize.define(
    'UserRecovering',
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
      tableName: 'user_recovery',
      underscored: true,
      instanceMethods: {
      },
      classMethods: {
      }
    }
  );

  return UserEmailVerification;
};
