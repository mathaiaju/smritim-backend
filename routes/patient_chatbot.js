const express = require("express");
const router = express.Router();
const db = require("../models");
const auth = require("../middleware/auth");
const { Op } = require("sequelize");

/* =====================================================
   GET /api/patient/chatbot/context
===================================================== */
router.get("/context", auth(["patient"]), async (req, res) => {
  try {
    const user_id = req.user.linked_id;
    const hospital_id = req.user.hospital_id;
    const today = new Date().toISOString().slice(0, 10);

    const schedules = await db.MedicationSchedule.findAll({
      where: { active: true },
      include: [{
        model: db.Medication,
        required: true,
        where: {
          user_id,
          hospital_id,
          [Op.or]: [
            { stop_date: null },
            { stop_date: { [Op.gte]: today } }
          ]
        }
      }],
      order: [["scheduled_time", "ASC"]]
    });

    const logs = await db.DailyLog.findAll({
      where: { user_id, hospital_id, log_date: today },
      attributes: ["medication_schedule_id"]
    });

    const logged = new Set(logs.map(l => l.medication_schedule_id));

    const pending = schedules
      .filter(s => !logged.has(s.id))
      .map(s => ({
        medication_schedule_id: s.id,
        medication_id: s.medication_id,
        drug_name: s.Medication.drug_name_generic,
        dose: s.dose,
        scheduled_time: s.scheduled_time,
        timing: s.after_food ? "after food" : "before food"
      }));

    res.json({ date: today, pending });
  } catch (err) {
    console.error("Chatbot context error:", err);
    res.status(500).json({ error: "server error" });
  }
});


/* =====================================================
   POST /api/patient/chatbot/adherence
   → DELEGATES to /api/dailyLogs
===================================================== */
router.post(
  "/adherence",
  auth(["patient"]),
  async (req, res) => {
    try {
      const {
        medication_schedule_id,
        medication_id,
        status,
        log_date
      } = req.body;

      if (!medication_schedule_id || !status || !log_date) {
        return res.status(400).json({ error: "Invalid payload" });
      }

      // 🔁 Call DAILY LOGS (RULE ENGINE LIVES THERE)
      req.url = "/";           // trick Express router
      req.method = "POST";
      req.body = {
        medication_schedule_id,
        medication_id,
        log_date,
        status
      };

      const dailyLogsRouter = require("./dailyLogs");
      return dailyLogsRouter.handle(req, res);

    } catch (err) {
      console.error("Chatbot adherence error:", err);
      res.status(500).json({ error: "server error" });
    }
  }
);

/* =====================================================
   POST /api/patient/chatbot/symptoms
   → ALSO delegates to /api/dailyLogs
===================================================== */
router.post(
  "/symptoms",
  auth(["patient"]),
  async (req, res) => {
    try {
      const {
        medication_schedule_id,
        medication_id,
        log_date,
        symptoms
      } = req.body;

      if (!medication_schedule_id || !log_date || !Array.isArray(symptoms)) {
        return res.status(400).json({ error: "Invalid payload" });
      }

      req.url = "/";
      req.method = "POST";
     req.body = {
      medication_schedule_id,
      medication_id,
      log_date,
      status: "taken",
      quick_se: symptoms,
      language: req.body.lang === "ml" ? "ml" : "en"
     };


      const dailyLogsRouter = require("./dailyLogs");
      return dailyLogsRouter.handle(req, res);

    } catch (err) {
      console.error("Chatbot symptom error:", err);
      res.status(500).json({ error: "server error" });
    }
  }
);



/* =====================================================
   GET /api/patient/chatbot/today-schedules
===================================================== */
router.get("/today-schedules", auth(["patient"]), async (req, res) => {
  try {
    const user_id = req.user.linked_id;
    const hospital_id = req.user.hospital_id;
    const today = new Date().toISOString().slice(0, 10);

    const schedules = await db.MedicationSchedule.findAll({
      where: { active: true },
      include: [{
        model: db.Medication,
        required: true,
        where: {
          user_id,
          hospital_id,
          [Op.or]: [
            { stop_date: null },
            { stop_date: { [Op.gte]: today } }
          ]
        }
      }],
      order: [["scheduled_time", "ASC"]]
    });

    const logs = await db.DailyLog.findAll({
      where: { user_id, hospital_id, log_date: today },
      attributes: ["medication_schedule_id"]
    });

    const logged = new Set(logs.map(l => l.medication_schedule_id));

    const pending = schedules
      .filter(s => !logged.has(s.id))
      .map(s => ({
        medication_schedule_id: s.id,
        medication_id: s.medication_id,
        drug_name: s.Medication.drug_name_generic,
        dose: s.dose,
        scheduled_time: s.scheduled_time,
        before_food: s.before_food,
        after_food: s.after_food
      }));

    res.json({ date: today, schedules: pending });
  } catch (err) {
    console.error("today-schedules error:", err);
    res.status(500).json({ error: "server error" });
  }
});

/* =====================================================
   GET /api/patient/chatbot/next-prompt
===================================================== */
router.get("/next-prompt", auth(["patient"]), async (req, res) => {
  try {
    const user_id = req.user.linked_id;
    const hospital_id = req.user.hospital_id;
    const today = new Date().toISOString().slice(0, 10);

    const schedules = await db.MedicationSchedule.findAll({
      where: { active: true },
      include: [{
        model: db.Medication,
        required: true,
        where: {
          user_id,
          hospital_id,
          [Op.or]: [
            { stop_date: null },
            { stop_date: { [Op.gte]: today } }
          ]
        }
      }],
      order: [["scheduled_time", "ASC"]]
    });

    const logs = await db.DailyLog.findAll({
      where: { user_id, hospital_id, log_date: today },
      attributes: ["medictation_schedule_id"]
    });

    const logged = new Set(logs.map(l => l.medication_schedule_id));
    const next = schedules.find(s => !logged.has(s.id));

    if (!next) return res.json({ done: true });

    res.json({
      done: false,
      schedule: {
        medication_schedule_id: next.id,
        medication_id: next.medication_id,
        drug_name: next.Medication.drug_name_generic,
        dose: next.dose,
        scheduled_time: next.scheduled_time,
        before_food: next.before_food,
        after_food: next.after_food
      }
    });
  } catch (err) {
    console.error("next-prompt error:", err);
    res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
