const db = require("../models");
const { Op } = db.Sequelize;

/*
=====================================================
  MAIN MOOD RULE EVALUATOR
=====================================================
*/
async function evaluateMoodRules(user_id, hospital_id) {
  const latest = await db.MoodLog.findOne({
    where: { user_id, hospital_id },
    order: [["log_date", "DESC"]],
  });

  if (!latest) return;

  /* ---------------------------------------------
     SAFETY — SELF HARM IDEATION (BLOCKING)
  --------------------------------------------- */
  if (latest.self_harm_ideation >= 2) {
    console.log("🚨 Creating Self Harm Safety Alert");

    await createAlert({
      user_id,
      hospital_id,
      alert_type: "self_harm_risk",
      severity: "critical",
      description: "Patient reports thoughts of self-harm.",
      metadata: {
        self_harm_score: latest.self_harm_ideation,
      },
    });
  }

  /* ---------------------------------------------
     MANIC / HYPOMANIC TREND
  --------------------------------------------- */
  if (latest.trend_state === "manic_trend") {
    console.log("⚠️ Creating Mania Trend Alert");

    await createAlert({
      user_id,
      hospital_id,
      alert_type: "mania_trend",
      severity: "high",
      description:
        "Higher energy with reduced sleep and increased activation detected.",
      metadata: {
        trend_state: latest.trend_state,
      },
    });
  }

  /* ---------------------------------------------
     DEPRESSIVE TREND
  --------------------------------------------- */
  if (latest.trend_state === "depressive_trend") {
    console.log("⚠️ Creating Depressive Trend Alert");

    await createAlert({
      user_id,
      hospital_id,
      alert_type: "depressive_trend",
      severity: "moderate",
      description:
        "Lower mood, reduced energy, and impaired functioning detected.",
      metadata: {
        trend_state: latest.trend_state,
      },
    });
  }
}

/*
=====================================================
  ALERT CREATION (DEDUPED + SAFE)
=====================================================
*/
async function createAlert({
  user_id,
  hospital_id,
  alert_type,
  severity,
  description,
  metadata = {},
}) {
  const today = new Date().toISOString().substring(0, 10);

  // 🔑 DEDUPE: one alert per type per day
  const existing = await db.Alert.findOne({
    where: {
      user_id,
      hospital_id,
      alert_type,
      created_at: {
        [Op.gte]: `${today} 00:00:00`,
      },
    },
  });

  if (existing) return existing;

  return db.Alert.create({
    hospital_id,
    user_id,

    alert_type,        // 🔑 MACHINE ID
    severity,
    description,

    source: "mood_engine",
    metadata,

    resolved: false,
  });
}

module.exports = { evaluateMoodRules };
