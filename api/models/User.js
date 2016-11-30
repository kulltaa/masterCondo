const bcrypt = require('bcryptjs');

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
        allowNull: false,
        validate: {
          isUnique(email, next) {
            User.find({ where: { email } })
              .then((result) => {
                if (result) {
                  return next(new Error('Email already in use'));
                }

                return next();
              })
              .catch(error => next(error));
          }
        }
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isUnique(username, next) {
            User.find({ where: { username } })
              .then((result) => {
                if (result) {
                  return next(new Error('Username already in use'));
                }

                return next();
              })
              .catch(error => next(error));
          }
        }
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

        /**
         * Create new user
         *
         * @param {String} email
         * @param {String} username
         * @param {String} password
         * @return {Promise}
         */
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
