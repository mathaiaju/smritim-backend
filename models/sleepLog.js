module.exports = (sequelize, DataTypes) => {
  const SleepLog = sequelize.define(
    "SleepLog",
    {
      hospital_id: { type: DataTypes.BIGINT, allowNull: false },
      user_id: { type: DataTypes.BIGINT, allowNull: false },

      log_date: { type: DataTypes.DATEONLY, allowNull: false },

      sleep_quality_rating: {
        type: DataTypes.TINYINT,
        allowNull: false
      },

      q1_sleep_onset: DataTypes.TINYINT,
      q2_maintenance: DataTypes.TINYINT,
      q3_duration: DataTypes.TINYINT,
      q4_restfulness: DataTypes.TINYINT,
      q5_daytime_impact: DataTypes.TINYINT,

      total_score: DataTypes.TINYINT,
      interpretation: DataTypes.STRING,

      notes: DataTypes.TEXT
    },
    {
      tableName: "sleep_logs",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      indexes: [
        { unique: true, fields: ["user_id", "log_date"] }
      ]
    }
  );

  return SleepLog;
};
