const createTable = function createTable(queryInterface, Sequelize) {
  return queryInterface.createTable(
    'user_access_token',
    {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      access_token: {
        type: Sequelize.STRING,
        allowNull: false
      },
      access_token_expired_at: {
        type: Sequelize.DATE,
        allowNull: false
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
    'user_access_token',
    field,
    {
      indexName,
      indicesType: 'UNIQUE'
    }
  );
};

module.exports = {
  up(queryInterface, Sequelize) {
    return createTable(queryInterface, Sequelize)
      .then(() => createUniqueIndex(queryInterface, 'idx_access_token', 'access_token'))
      .catch(error => console.log(error));
  },

  down(queryInterface) {
    return queryInterface.dropTable('user_access_token');
  }
};
