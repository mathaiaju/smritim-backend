// models/hospital.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "Hospital",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      contact_email: {
        type: DataTypes.STRING(100)
      },
      contact_phone: {
        type: DataTypes.STRING(20)
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      tableName: "hospitals",
      timestamps: false
    }
  );
