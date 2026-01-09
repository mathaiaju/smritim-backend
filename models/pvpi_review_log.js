const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "PvpiReviewLog",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },

    

      /* =========================
         CORE REFERENCES
      ========================= */
      case_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },

      reviewer_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },

      /* =========================
         REVIEW ACTION
      ========================= */
      action: {
        type: DataTypes.ENUM("pending", "verified", "rejected"),
        allowNull: false
      },

      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: "pvpi_review_logs",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      
    }
  );
