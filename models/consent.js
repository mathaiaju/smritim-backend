const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "Consent",
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

      version: {
        type: DataTypes.STRING(20),
        allowNull: false
      },

      share_with_clinician: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },

      share_with_caregiver: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },

      share_with_pvpi: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },

      consent_text: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      consented_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },

      revoked_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: "consent",
      timestamps: false,
      indexes: [
        {
          fields: ["user_id"]
        }
      ]
    }
  );
