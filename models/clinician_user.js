const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "ClinicianUser",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },

      hospital_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },

      full_name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },

      email: {
        type: DataTypes.STRING(100),
        allowNull: false
      },

      phone: {
        type: DataTypes.STRING(20),
        allowNull: true
      },

      role: {
        type: DataTypes.ENUM("doctor", "pharmacologist", "nurse"),
        allowNull: false
      },

    
    },
    {
      tableName: "clinician_users",
      timestamps: false,
      indexes: [
        {
          fields: ["hospital_id"]
        },
        {
          unique: true,
          fields: ["hospital_id", "email"]
        }
      ]
    }
  );
