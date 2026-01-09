const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "AuditLog",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },

      hospital_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },

      user_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },

      role: {
        type: DataTypes.STRING(50),
        allowNull: true
      },

      action: {
        type: DataTypes.STRING(100),
        allowNull: false
      },

      entity: {
        type: DataTypes.STRING(50),
        allowNull: true
      },

      entity_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },

      request_id: {
        type: DataTypes.STRING(50),
        allowNull: true
      },

      payload: {
        type: DataTypes.JSON,
        allowNull: true
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: "audit_logs",
      timestamps: false, // IMPORTANT — matches your table
      indexes: [
        { fields: ["hospital_id"] },
        { fields: ["user_id"] },
        { fields: ["entity"] },
        { fields: ["entity_id"] },
        { fields: ["created_at"] }
      ]
    }
  );
