const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "Rule",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },

      
      /* =========================
         RULE METADATA
      ========================= */
      rule_name: {
        type: DataTypes.STRING(150),
        allowNull: false
      },

      // NULL = applies to ALL drugs (general rule)
      drug_name: {
        type: DataTypes.STRING(100),
        allowNull: true
      },

      // Supports multi-symptom logic: "fever +/ tremor"
      symptom: {
        type: DataTypes.STRING(255),
        allowNull: false
      },

      /* =========================
         SEVERITY (MUST MATCH ALERTS)
      ========================= */
      severity: {
        type: DataTypes.ENUM("low", "moderate", "high", "critical"),
        allowNull: false
      },

      action_card: {
        type: DataTypes.TEXT,
        allowNull: false
      },

      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      tableName: "rules",
      timestamps: false,
      indexes: [
        {
          name: "idx_rules_active",
          fields: ["active"]
        },
        {
          name: "idx_rules_severity",
          fields: ["severity"]
        },
        {
          name: "idx_rules_drug",
          fields: ["drug_name"]
        }
       
      ]
    }
  );
