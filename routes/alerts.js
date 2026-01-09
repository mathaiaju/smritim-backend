const express = require("express");
const router = express.Router();
const db = require("../models");
const auth = require("../middleware/auth");

/* =====================================================
   GET /api/alerts
   Role-based + Hospital-scoped alert listing
===================================================== */
router.get(
  "/",
  auth(["hospital_admin", "clinician", "caregiver", "patient"]),
  async (req, res) => {
    try {
      const { role, hospital_id, linked_id } = req.user;

      const where = { hospital_id };

      // 🔐 Patient → only own alerts
      if (role === "patient") {
        where.user_id = linked_id;
      }

      // 🔐 Caregiver → alerts for linked patients
      if (role === "caregiver") {
        const links = await db.PatientCaregiverLink.findAll({
          where: { caregiver_id: linked_id },
          attributes: ["user_id"]
        });

        where.user_id = links.map(l => l.user_id);
      }

      // 🔐 Clinician → alerts for assigned patients
      if (role === "clinician") {
        const links = await db.PatientClinicianLink.findAll({
          where: { clinician_id: linked_id },
          attributes: ["user_id"]
        });

        where.user_id = links.map(l => l.user_id);
      }

     const alerts = await db.Alert.findAll({
  where,
  include: [
    {
      model: db.User,
      attributes: ["id", "full_name", "phone"]
    },
    {
      model: db.Medication,
      attributes: [
        "id",
        "drug_name_generic",
        "drug_name_brand",
        "indication"
      ]
    },
    {
      model: db.Rule,
      attributes: [
        "id",
        "severity",
        "action_card" // ✅ VALID columns only
      ]
    }
  ],
  order: [["created_at", "DESC"]],
  limit: 200
});
      res.json({
        count: alerts.length,
        alerts
      });
    } catch (err) {
      console.error("Get alerts error:", err);
      res.status(500).json({ error: "server error" });
    }
  }
);

/* =====================================================
   PUT /api/alerts/:id/resolve
===================================================== */
router.put(
  "/:id/resolve",
  auth(["hospital_admin", "clinician"]),
  async (req, res) => {
    try {
      const { hospital_id } = req.user;
      const alertId = req.params.id;

      const alert = await db.Alert.findOne({
        where: { id: alertId, hospital_id }
      });

      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }

      if (alert.resolved) {
        return res.status(400).json({ error: "Alert already resolved" });
      }

      await alert.update({
        resolved: true,
        resolved_at: new Date()
      });

      res.json({
        message: "Alert resolved",
        alert_id: alert.id,
        resolved_at: alert.resolved_at
      });
    } catch (err) {
      console.error("Resolve alert error:", err);
      res.status(500).json({ error: "server error" });
    }
  }
);

module.exports = router;
