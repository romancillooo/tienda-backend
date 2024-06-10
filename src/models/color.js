module.exports = (sequelize, DataTypes) => {
    const Color = sequelize.define('Color', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      hex_code: {
        type: DataTypes.STRING,
        allowNull: false
      }
    });
  
    return Color;
  };
  