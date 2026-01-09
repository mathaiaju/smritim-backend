const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "Medication",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },

      hospital_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },

      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },

      drug_name_generic: {
        type: DataTypes.STRING(100),
        allowNull: false
      },

      drug_name_brand: {
        type: DataTypes.STRING(100),
        allowNull: true
      },

      indication: {
        type: DataTypes.STRING(255),
        allowNull: true
      },

      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },

      stop_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      }
    },
    {
      tableName: "medications",
      timestamps: false,
      indexes: [
        {
          name: "idx_medication_hospital_user",
          fields: ["hospital_id", "user_id"]
        }
      ]
    }
  );
