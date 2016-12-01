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
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false
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
        isPasswordCorrect(password, hash) {
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
            password_hash: passwordHash
          });
        },

        /**
         * Find password hash by email
         *
         * @param {String} email
         * @return {String}
         */
        findPasswordHashByEmail(email) {
          const cond = {
            where: { email },
            attributes: ['password_hash']
          };

          return this.find(cond)
            .then(result => (result ? result.getDataValue('password_hash') : ''))
            .catch(error => Promise.reject(error));
        }
      }
    }
  );

  return User;
};
