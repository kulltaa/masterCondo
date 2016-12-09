const createTable = function createTable(queryInterface, Sequelize) {
  return queryInterface.createTable(
    'user_recovery',
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
      token: {
        type: Sequelize.STRING,
        allowNull: false
      },
      token_expired_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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

module.exports = {
  up(queryInterface, Sequelize) {
    return createTable(queryInterface, Sequelize);
  },

  down(queryInterface) {
    return queryInterface.dropTable('user_recovery');
  }
};
