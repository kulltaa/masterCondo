const Promise = require('bluebird');

const createUserTable = function createUserTable(queryInterface, Sequelize) {
  return queryInterface.createTable(
    'user',
    {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: ''
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: ''
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: ''
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    },
    {
      engine: 'InnoDB',
      charset: 'utf8'
    }
  );
};

const createUniqueIndex = function createUniqueIndex(queryInterface, indexName, ...field) {
  return queryInterface.addIndex(
    'user',
    field,
    {
      indexName,
      indicesType: 'UNIQUE'
    }
  );
};

module.exports = {
  up(queryInterface, Sequelize) {
    return createUserTable(queryInterface, Sequelize)
      .then(() => {
        const createEmailUnique = createUniqueIndex(queryInterface, 'idx_email', 'email');
        const createUsernameUnique = createUniqueIndex(queryInterface, 'idx_username', 'username');

        return Promise.all([createEmailUnique, createUsernameUnique]);
      })
      .catch(error => console.log(error));
  },

  down(queryInterface) {
    return queryInterface.dropTable('user');
  }
};
