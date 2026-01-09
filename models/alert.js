const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "Alert",
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

      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },

      medication_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },

      medication_schedule_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },

      rule_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },

      severity: {
        type: DataTypes.ENUM("low", "moderate", "high", "critical"),
        allowNull: false
      },

      alert_type: {
        type: DataTypes.ENUM("safety", "adherence"),
        allowNull: false
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },

      resolved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },

      resolved_at: {
        type: DataTypes.DATE,
        allowNull: true
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: "alerts",
      timestamps: false
    }
  );
