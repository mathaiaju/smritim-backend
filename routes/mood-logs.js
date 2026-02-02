const express = require("express");
const router = express.Router();
const db = require("../models");
const auth = require("../middleware/auth");
const { evaluateMoodRules } = require("../services/moodRuleEngine");

/* =========================
   POST /api/mood-logs
========================= */
router.post(
  "/",
  auth(["patient"]),
  async (req, res) => {
    try {
      const { hospital_id, linked_id: user_id } = req.user;
      const payload = req.body;


      // Mood Log Details received in the payload
      console.log("mood_level:", payload.mood_level);
      console.log("energy_level:", payload.energy_level);
      console.log("sleep_change:", payload.sleep_change);
      console.log("daily_functioning:", payload.daily_functioning);
      console.log("thought_speed:", payload.thought_speed);
      console.log("impulsivity:", payload.impulsivity);

      const trend_state = deriveTrend(payload);

      await db.MoodLog.upsert({
        hospital_id,
        user_id,
        ...payload,
        trend_state
      });

      /* 🔥 Rule Evaluation */
      await evaluateMoodRules(user_id, hospital_id);

      res.json({ success: true, trend_state });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "failed to save mood log" });
    }
  }
);

function deriveTrend(p) {

  //Low mood, low energy, Over sleeping = Depressive Trend
  if (
    p.mood_level <= 2 &&
    p.energy_level <= 2 &&
    p.sleep_change <= 2 
    //(p.sleep_change === 1 || p.daily_functioning <= 2)
  ) {
    console.log("Depressive trend detected");
    console.log("mood_level:", p.mood_level);
    console.log("energy_level:", p.energy_level);
    console.log("sleep_change:", p.sleep_change);
   
    return "depressive_trend";
  }

   //High mood or High energy, Low sleep, racing thoughts  = Manic Trend
  if (
    (p.mood_level >= 4 ||
    p.energy_level >= 4) &&
    p.sleep_change >= 3 &&
    p.thought_speed >= 3)
   {
    console.log("Manic trend detected");
    console.log("mood_level:", p.mood_level);
    console.log("energy_level:", p.energy_level);
    console.log("sleep_change:", p.sleep_change);
    console.log("thought_speed:", p.thought_speed);
  
    return "manic_trend";
  }

  return "stable";
}

module.exports = router;
