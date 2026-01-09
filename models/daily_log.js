const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "DailyLog",
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

      medication_id: {
        type: DataTypes.BIGINT,
        allowNull: true // legacy support
      },

      medication_schedule_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },

      log_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },

      status: {
        type: DataTypes.ENUM("taken", "late", "skipped"),
        allowNull: false
      },

      minutes_late: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },

      reason: {
        type: DataTypes.ENUM(
          "forgot",
          "side_effect",
          "ran_out",
          "cost",
          "other",
          "no_response"
        ),
        allowNull: true
      },

      quick_se: {
        type: DataTypes.JSON,
        allowNull: true
      },

      mood_score: {
        type: DataTypes.TINYINT,
        allowNull: true
      },

      sleep_hours: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: true
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },

      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: "daily_logs",
      timestamps: false,
      indexes: [
        { fields: ["hospital_id"] },
        { fields: ["user_id"] },
        { fields: ["medication_schedule_id"] },
        { fields: ["hospital_id", "user_id", "log_date"] }
      ]
    }
  );
