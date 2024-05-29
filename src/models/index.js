const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('tiendaenlinea', 'root', '', {
  host: 'localhost',
  dialect: 'mysql' 
});

const Color = require('./color')(sequelize, DataTypes);

const db = {
  Sequelize,
  sequelize,
  Color,
};

module.exports = db;
