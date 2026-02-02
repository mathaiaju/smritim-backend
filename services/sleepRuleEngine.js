const db = require("../models");

/*
=====================================================
  SLEEP RULE ENGINE (NO ALERTS)
=====================================================
Sleep interpretation is CONTEXTUAL, not alerting.
Alerts should be generated only via:
- mood trends
- safety signals
- multi-day aggregation (future)
=====================================================
*/

async function evaluateSleepRules({
  user_id,
  hospital_id,
  medication_id,
  medication_schedule_id,
}) {
  const latest = await db.SleepLog.findOne({
    where: { user_id, hospital_id },
    order: [["log_date", "DESC"]],
  });

  if (!latest) return;

  // 👉 Intentionally NO alerts here
  // 👉 Sleep is a contextual signal only

  // Optional: future extension
  // - write flags
  // - update daily_log
  // - feed aggregation job

  console.log(
    "Sleep evaluated (no alert):",
    latest.log_date,
    latest.interpretation
  );
}

module.exports = { evaluateSleepRules };
