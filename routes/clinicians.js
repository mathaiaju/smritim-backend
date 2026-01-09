const express = require("express");
const router = express.Router();
const db = require("../models");
const pdfGen = require("../services/pdfGenerator");
const { Op } = require("sequelize");
const auth = require("../middleware/auth");


/* =====================================================
   GET /api/clinicians
   Hospital admin – list clinicians in hospital
===================================================== */
router.get("/", auth(["hospital_admin"]), async (req, res) => {
  try {
    const clinicians = await db.ClinicianUser.findAll({
      where: { hospital_id: req.user.hospital_id },
      attributes: [
        "id",
        "hospital_id",
        "full_name",
        "email",
        "phone",
        "role"
      ],
      order: [["id", "ASC"]]
    });

    res.json(clinicians);
  } catch (err) {
    console.error("List clinicians error:", err);
    res.status(500).json({ error: "server error" });
  }
});

/* =====================================================
   GET /api/clinicians/me/patients
   Clinician – list own patients
===================================================== */
router.get("/me/patients", auth(["clinician"]), async (req, res) => {
  try {
    const clinicianId = req.user.linked_id;

    const links = await db.PatientClinicianLink.findAll({
      where: {
        clinician_id: clinicianId
       
      },
      include: [
        {
          model: db.User,
          attributes: ["id", "full_name", "phone"],
          where: { hospital_id: req.user.hospital_id }
        }
      ]
    });

    const patients = links.map(l => l.User);
    res.json(patients);
  } catch (err) {
    console.error("Clinician patients error:", err);
    res.status(500).json({ error: "server error" });
  }
});

/* =====================================================
   GET /api/clinicians/patient/:userId/weekly-summary
===================================================== */
router.get(
  "/patient/:userId/weekly-summary",
  auth(["clinician"]),
  async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);

      // 🔐 Verify clinician–patient link + tenant
      const link = await db.PatientClinicianLink.findOne({
        where: {
          clinician_id: req.user.linked_id,
          user_id: userId,
           },
        include: [{
          model: db.User,
          attributes: ["id", "full_name", "phone"],
          where: { hospital_id: req.user.hospital_id } // ✅ filter via User
        }]
    });

      if (!link) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const start = new Date();
      start.setDate(start.getDate() - 6);

      const logs = await db.DailyLog.findAll({
        where: {
          user_id: userId,
          hospital_id: req.user.hospital_id,
          log_date: { [Op.gte]: start }
        }
      });

      const total = logs.length;
      const taken = logs.filter(l => l.status === "taken").length;

      const symptomCounts = {};
      logs.forEach(l => {
        if (Array.isArray(l.quick_se)) {
          l.quick_se.forEach(s => {
            symptomCounts[s] = (symptomCounts[s] || 0) + 1;
          });
        }
      });

      res.json({
        adherencePercent: total ? Math.round((taken / total) * 100) : 0,
        topSymptoms: Object.entries(symptomCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5),
        logsCount: logs.length
      });
    } catch (err) {
      console.error("Weekly summary error:", err);
      res.status(500).json({ error: "server error" });
    }
  }
);

/* =====================================================
   GET /api/clinicians/patient/:userId/export-pdf
===================================================== */
router.get(
  "/patient/:userId/export-pdf",
  auth(["clinician"]),
  async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);

      const link = await db.PatientClinicianLink.findOne({
        where: {
          clinician_id: req.user.linked_id,
          user_id: userId,
          },
      include: [{
        model: db.User,
        where: { hospital_id: req.user.hospital_id }
      }]
    });

      if (!link) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const buffer = await pdfGen.generatePatientOnePager(userId);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="patient_${userId}_onepager.pdf"`
      );

      res.send(buffer);
    } catch (err) {
      console.error("PDF error:", err);
      res.status(500).json({ error: "PDF generation failed" });
    }
  }
);

/* =====================================================
   GET /api/clinicians/alerts
   Clinician alerts for own patients
===================================================== */
router.get("/alerts", auth(["clinician"]), async (req, res) => {
  try {
    const links = await db.PatientClinicianLink.findAll({
       where: {
    clinician_id: clinicianId
    },
    include: [{
      model: db.User,
      attributes: ["id", "full_name", "phone"],
      where: { hospital_id: req.user.hospital_id } // ✅ filter via User
   }]
});

    const userIds = links.map(l => l.user_id);

    if (userIds.length === 0) {
      return res.json({ count: 0, alerts: [] });
    }

    const alerts = await db.Alert.findAll({
      where: {
        user_id: userIds,
        hospital_id: req.user.hospital_id
      },
      order: [["created_at", "DESC"]],
      limit: 50
    });

    res.json({ count: alerts.length, alerts });
  } catch (err) {
    console.error("Clinician alerts error:", err);
    res.status(500).json({ error: "server error" });
  }
});


router.get(
  "/patient/:userId/adherence-summary",
  auth(["clinician"]),
  async (req, res) => {
    const userId = Number(req.params.userId);

    // 🔐 Verify clinician–patient link
    const link = await db.PatientClinicianLink.findOne({
      where: {
        clinician_id: req.user.linked_id,
        user_id: userId
      }
    });

    if (!link) {
      return res.status(403).json({ error: "Not authorized" });
    }

    //const start = new Date();
    //start.setDate(start.getDate() - 1);

    const logs = await db.DailyLog.findAll({
      where: {
        user_id: userId,
        hospital_id: req.user.hospital_id
        //log_date: { [Op.gte]: start }
      }
    });

    const total = logs.length;
    const taken = logs.filter(l => l.status === "taken").length;

    res.json({
      total_expected: total,
      taken,
      missed: total - taken,
      adherence_percent: total
        ? Math.round((taken / total) * 100)
        : 0
    });
  }
);
router.get(
  "/patient/:userId/top-symptoms",
  auth(["clinician"]),
  async (req, res) => {
    const userId = Number(req.params.userId);

    const link = await db.PatientClinicianLink.findOne({
      where: {
        clinician_id: req.user.linked_id,
        user_id: userId
      }
    });

    if (!link) {
      return res.status(403).json({ error: "Not authorized" });
    }

    //const start = new Date();
    //start.setDate(start.getDate() - 6);

    const logs = await db.DailyLog.findAll({
      where: {
        user_id: userId,
        hospital_id: req.user.hospital_id
        //log_date: { [Op.gte]: start }
      }
    });

    const counts = {};

    logs.forEach(l => {
      if (Array.isArray(l.quick_se)) {
        l.quick_se.forEach(s => {
          counts[s] = (counts[s] || 0) + 1;
        });
      }
    });

    const symptoms = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({ symptoms });
  }
);
router.get(
  "/patient/:userId/daily-adherence",
  auth(["clinician"]),
  async (req, res) => {
    const userId = Number(req.params.userId);

    const link = await db.PatientClinicianLink.findOne({
      where: {
        clinician_id: req.user.linked_id,
        user_id: userId
      }
    });

    if (!link) {
      return res.status(403).json({ error: "Not authorized" });
    }

    //const start = new Date();
    //start.setDate(start.getDate() - 6);

    const logs = await db.DailyLog.findAll({
      where: {
        user_id: userId,
        hospital_id: req.user.hospital_id
        //log_date: { [Op.gte]: start }
      }
    });

    const map = {};

    logs.forEach(l => {
      const d = l.log_date;
      map[d] ??= { date: d, taken: 0, missed: 0 };
      l.status === "taken" ? map[d].taken++ : map[d].missed++;
    });

    res.json({ days: Object.values(map) });
  }
);

/* =====================================================
   GET /api/clinicians/patient/:userId/adherence-details
   Detailed daily adherence logs (7 days)
===================================================== */
router.get(
  "/patient/:userId/adherence-details",
  auth(["clinician"]),
  async (req, res) => {
    try {
      const userId = Number(req.params.userId);

      const link = await db.PatientClinicianLink.findOne({
        where: {
          clinician_id: req.user.linked_id,
          user_id: userId
        }
      });

      if (!link) {
        return res.status(403).json({ error: "Not authorized" });
      }

      //const start = new Date();
      //start.setDate(start.getDate() - 6);

      const logs = await db.DailyLog.findAll({
        where: {
          user_id: userId,
          hospital_id: req.user.hospital_id
          //log_date: { [Op.gte]: start }
        },
        order: [["log_date", "DESC"]]
      });

      const detailed = logs.map(l => ({
        date: l.log_date,
        medication: l.medication_name || "Medication",
        status: l.status
      }));

      res.json({ logs: detailed });
    } catch (err) {
      console.error("Adherence details error:", err);
      res.status(500).json({ error: "server error" });
    }
  }
);

/* =====================================================
   GET /api/clinicians/patient/:userId/symptom-breakdown
   Symptom frequency with dates
===================================================== */
router.get(
  "/patient/:userId/symptom-breakdown",
  auth(["clinician"]),
  async (req, res) => {
    try {
      const userId = Number(req.params.userId);

      const link = await db.PatientClinicianLink.findOne({
        where: {
          clinician_id: req.user.linked_id,
          user_id: userId
        }
      });

      if (!link) {
        return res.status(403).json({ error: "Not authorized" });
      }

      //const start = new Date();
      //start.setDate(start.getDate() - 6);

      const logs = await db.DailyLog.findAll({
        where: {
          user_id: userId,
          hospital_id: req.user.hospital_id
          //log_date: { [Op.gte]: start }
        }
      });

      const breakdown = {};

      logs.forEach(l => {
        if (Array.isArray(l.quick_se)) {
          l.quick_se.forEach(symptom => {
            breakdown[symptom] ??= [];
            breakdown[symptom].push(l.log_date);
          });
        }
      });

      const response = Object.entries(breakdown).map(
        ([name, dates]) => ({
          name,
          count: dates.length,
          dates
        })
      );

      res.json({ symptoms: response });
    } catch (err) {
      console.error("Symptom breakdown error:", err);
      res.status(500).json({ error: "server error" });
    }
  }
);




module.exports = router;
