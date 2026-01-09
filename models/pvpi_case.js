const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "PvpiCase",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },

      /* =========================
         TENANT SCOPING (MANDATORY)
      ========================= */
      hospital_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },

      /* =========================
         CORE REFERENCES
      ========================= */
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },

      medication_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },

      medication_schedule_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },

      /* =========================
         ADR DETAILS
      ========================= */
      log_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },

      original_term: {
        type: DataTypes.STRING(255),
        allowNull: false
      },

      // 🔑 MedDRA mapping (optional but essential)
      meddra_term_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },

      seriousness: {
        type: DataTypes.ENUM("mild", "moderate", "serious"),
        allowNull: false
      },

      outcome: {
        type: DataTypes.ENUM("unknown", "recovered", "ongoing", "fatal"),
        defaultValue: "unknown"
      },

      /* =========================
         PvPI / AMC WORKFLOW
      ========================= */
      verified_by: {
        type: DataTypes.BIGINT,
        allowNull: true
      },

      submitted_to_pvpi: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },

      submitted_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: "pvpi_cases",
      timestamps: false,
      indexes: [
        {
          name: "idx_pvpi_hospital",
          fields: ["hospital_id"]
        },
        {
          name: "idx_pvpi_hospital_user",
          fields: ["hospital_id", "user_id"]
        },
        {
          name: "idx_pvpi_hospital_status",
          fields: ["hospital_id", "submitted_to_pvpi"]
        }
      ]
    }
  );
