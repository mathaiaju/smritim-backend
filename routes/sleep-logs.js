const express = require("express");
const router = express.Router();
const db = require("../models");
const auth = require("../middleware/auth");
const { evaluateSleepRules } = require("../services/sleepRuleEngine");

/* =========================
   POST /api/sleep-logs
========================= */
router.post(
  "/",
  auth(["patient"]),
  async (req, res) => {
    try {
      const { hospital_id, linked_id: user_id } = req.user;
      const {
        log_date,
        sleep_quality_rating,
        q1_sleep_onset,
        q2_maintenance,
        q3_duration,
        q4_restfulness,
        q5_daytime_impact,
        notes
      } = req.body;

      // Sleep Quality Calculations
      console.log("sleep_quality_rating:", sleep_quality_rating);
      console.log("q1_sleep_onset:", q1_sleep_onset);
      console.log("q2_maintenance:", q2_maintenance);
      console.log("q3_duration:", q3_duration);
      console.log("q4_restfulness:", q4_restfulness);
      console.log("q5_daytime_impact:", q5_daytime_impact);
      console.log("Notes:", notes);


      const total_score =
        q1_sleep_onset +
        q2_maintenance +
        q3_duration +
        q4_restfulness +
        q5_daytime_impact;

     

      let interpretation = "poor";
      if (total_score >= 17) interpretation = "excellent";
      else if (total_score >= 13) interpretation = "good";
      else if (total_score <= 8) interpretation = "very_poor";

      console.log("Total Sleep Score:", total_score);
      console.log("Interpretation:", interpretation);

      const log = await db.SleepLog.upsert({
        hospital_id,
        user_id,
        log_date,
        sleep_quality_rating,
        q1_sleep_onset,
        q2_maintenance,
        q3_duration,
        q4_restfulness,
        q5_daytime_impact,
        total_score,
        interpretation,
        notes
      });

      /* 🔥 Rule Evaluation */
    

      await evaluateSleepRules({
        user_id,
        hospital_id,
        medication_id: req.user.medication_id ?? null,
        medication_schedule_id: req.user.medication_schedule_id ?? null,
      });


      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "failed to save sleep log" });
    }
  }
);


function deriveSleepSignals(sleep) {
  return {
    severe_sleep_disruption:
      sleep.total_score <= 8,          // very poor sleep
    sleep_deficit:
      sleep.q3_duration <= 2           // <6 hours
  };
}


module.exports = router;
