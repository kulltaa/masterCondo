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
      instanceMethods: {

        /**
         * Get user id
         *
         * @return {String}
         */
        getId() {
          return this.getDataValue('id');
        },

        /**
         * Get email
         *
         * @return {String}
         */
        getEmail() {
          return this.getDataValue('email');
        },

        /**
         * Get username
         *
         * @return {String}
         */
        getUsername() {
          return this.getDataValue('username');
        },

        /**
         * Get password hash
         *
         * @return {String}
         */
        getPasswordHash() {
          return this.getDataValue('password_hash');
        },

        /**
         * Get user status
         *
         * @return {Boolean}
         */
        getStatus() {
          return this.getDataValue('is_active');
        }
      },
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
        validatePassword(password, hash) {
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
          const payload = {
            email,
            username,
            password_hash: passwordHash
          };

          return this.create(payload);
        },

        /**
         * Find by email
         *
         * @param {String} email
         * @return {String}
         */
        findByEmail(email) {
          const cond = {
            where: { email }
          };

          return this.find(cond);
        },

        /**
         * Verify user by email
         *
         * @param {String} email
         * @return {Promise}
         */
        verifyByEmail(email) {
          return this.update(
            { is_active: true },
            { where: { email } }
          );
        }
      }
    }
  );

  return User;
};
