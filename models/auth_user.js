module.exports = (sequelize, DataTypes) => {
  const AuthUser = sequelize.define(
    "AuthUser",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },

      username: {
        type: DataTypes.STRING(100),
        allowNull: false
      },

      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
      },

      role: {
        type: DataTypes.ENUM(
          "hospital_admin",
          "clinician",
          "caregiver",
          "patient"
        ),
        allowNull: false
      },

      /**
       * linked_id meaning:
       * - hospital_admin → hospitals.id
       * - clinician → clinician_users.id
       * - caregiver → caregivers.id
       * - patient → users.id
       */
      linked_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },

      hospital_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },

      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: "auth_users",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["username", "hospital_id"]
        },
        {
          fields: ["role"]
        },
        {
          fields: ["hospital_id"]
        }
      ]
    }
  );

  return AuthUser;
};
