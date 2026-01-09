const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },

      /* =========================
         TENANT SCOPE (CRITICAL)
      ========================= */
      hospital_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },

      /* =========================
         CORE IDENTITY
      ========================= */
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false
      },

      full_name: {
        type: DataTypes.STRING(100)
      },

      locale: {
        type: DataTypes.ENUM("ml", "en"),
        defaultValue: "ml"
      },

      emergency_contact: {
        type: DataTypes.STRING(20)
      },

     /* is_active: {
       type: DataTypes.BOOLEAN,
       defaultValue: true
     },*/

      /* =========================
         AUDIT FIELDS (OPTIONAL BUT RECOMMENDED)
      ========================= */
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
      tableName: "users",
      timestamps: false,
      indexes: [
        {
          name: "idx_user_phone_hospital",
          unique: true,
          fields: ["hospital_id", "phone"]
        },
        {
          name: "idx_user_hospital",
          fields: ["hospital_id"]
        }
      ]
    }
  );
