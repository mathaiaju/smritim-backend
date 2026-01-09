const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "MedicationSchedule",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },

  
      medication_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },

      dose: {
        type: DataTypes.STRING(50)
      },

      time_of_day: {
        type: DataTypes.ENUM("morning", "afternoon", "evening", "night")
      },

      scheduled_time: {
        type: DataTypes.TIME
      },

      before_food: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },

      after_food: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },

      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      tableName: "medication_schedules",
      timestamps: false
    }
  );
