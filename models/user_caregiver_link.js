module.exports = (sequelize, DataTypes) => {
  const PatientCaregiverLink = sequelize.define(
    "PatientCaregiverLink",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      hospital_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      caregiver_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      notify_missed: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      notify_redflag: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      tableName: "patient_caregiver_links",
      underscored: true,
      timestamps: true
    }
  );

  PatientCaregiverLink.associate = models => {
    PatientCaregiverLink.belongsTo(models.User, {
      foreignKey: "user_id"
    });

    PatientCaregiverLink.belongsTo(models.Caregiver, {
      foreignKey: "caregiver_id"
    });
  };

  return PatientCaregiverLink;
};
