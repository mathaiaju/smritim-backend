const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "Caregiver",
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

      phone: {
        type: DataTypes.STRING(20),
        allowNull: false
      },

      relation: {
        type: DataTypes.STRING(50),
        allowNull: true
      },

      
    },
    {
      tableName: "caregivers",
      timestamps: false,
      indexes: [
        {
          fields: ["hospital_id"]
        },
        {
          fields: ["phone"]
        }
      ]
    }
  );
