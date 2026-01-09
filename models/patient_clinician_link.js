const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "PatientClinicianLink",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },

      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },

      clinician_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },

      relationship: {
        type: DataTypes.ENUM("primary", "secondary"),
        defaultValue: "primary"
      }
    },
    {
      tableName: "patient_clinician_link",
      timestamps: false,
   
    }
  );
