module.exports = (sequelize, DataTypes) => {
  const MoodLog = sequelize.define(
    "MoodLog",
    {
      hospital_id: { type: DataTypes.BIGINT, allowNull: false },
      user_id: { type: DataTypes.BIGINT, allowNull: false },

      log_date: { type: DataTypes.DATEONLY, allowNull: false },

      mood_level: DataTypes.TINYINT,
      energy_level: DataTypes.TINYINT,
      sleep_change: DataTypes.TINYINT,
      thought_speed: DataTypes.TINYINT,
      impulsivity: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: null
      },

      daily_functioning: DataTypes.TINYINT,

      hopelessness: DataTypes.TINYINT,
      slowed_down: DataTypes.TINYINT,
      overconfidence: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: null
      },
     risk_taking: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: null
      },
 
   

      self_harm_ideation: DataTypes.TINYINT,

      trend_state: {
        type: DataTypes.ENUM(
          "stable",
          "depressive_trend",
          "manic_trend",
          "mixed",
          "unknown"
        ),
        defaultValue: "unknown"
      }
    },
    {
      tableName: "mood_logs",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      indexes: [
        { unique: true, fields: ["user_id", "log_date"] },
        { fields: ["trend_state"] }
      ]
    }
  );

  return MoodLog;
};
