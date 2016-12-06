const createTable = function createTable(queryInterface, Sequelize) {
  return queryInterface.createTable(
    'user_email_verification',
    {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      token: {
        type: Sequelize.STRING,
        allowNull: false
      },
      token_expired_at: {
        type: Sequelize.DATE,
        allowNull: false
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
    'user_email_verification',
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
      .then(() => createUniqueIndex(queryInterface, 'idx_email', 'email'))
      .catch(error => console.log(error));
  },

  down(queryInterface) {
    return queryInterface.dropTable('user_email_verification');
  }
};
