const bcrypt = require('bcrypt-nodejs');

module.exports = function createUserModel(sequelize, DataTypes) {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: ''
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    },
    {
      tableName: 'user',
      underscored: true,
      classMethods: {
        associate(models) {
          User.hasMany(models.UserAccessToken);
        },

        /**
         * Hash password
         *
         * @param {String} password
         * @return {String}
         */
        hash(password) {
          return bcrypt.hashSync(password, bcrypt.genSaltSync());
        },

        /**
         * Validate password
         *
         * @param {String} password
         * @param {String} hash
         * @return {Boolean}
         */
        validate(password, hash) {
          return bcrypt.compareSync(password, hash);
        },

        createNewUser({ email, username, password }) {
          const passwordHash = this.hash(password);

          return this.create({
            email,
            username,
            password: passwordHash
          });
        }
      }
    }
  );

  return User;
};
