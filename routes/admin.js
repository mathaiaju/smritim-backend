const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const db = require("../models");
const auth = require("../middleware/auth");

/* =====================================================
   GET /api/admin/dashboard-stats
   Hospital Admin Dashboard Summary
===================================================== */
router.get(
  "/dashboard-stats",
  auth(["hospital_admin"]),
  async (req, res) => {
    try {
      const { hospital_id } = req.user;

      // ─────────────────────────────
      // Hospital
      // ─────────────────────────────
      const hospital = await db.Hospital.findOne({
        where: { id: hospital_id },
        attributes: ["id", "name"]
      });

      if (!hospital) {
        return res.status(404).json({ error: "Hospital not found" });
      }

      // ─────────────────────────────
      // Parallel counts (FAST)
      // ─────────────────────────────
      const [
        patientsCount,
        cliniciansCount,
        caregiversCount,
        alertsCount
      ] = await Promise.all([
        db.User.count({
          where: {
            hospital_id
            //is_active: true
          }
        }),

        db.ClinicianUser.count({
          where: {
            hospital_id
            //is_active: true
          }
        }),

        db.Caregiver.count({
          where: {
            hospital_id
            //is_active: true
          }
        }),

        db.Alert.count({
          where: {
            hospital_id,
            resolved: false
          }
        })
      ]);

      // ─────────────────────────────
      // Response
      // ─────────────────────────────
      res.json({
        hospital_name: hospital.name,
        patients: patientsCount,
        clinicians: cliniciansCount,
        caregivers: caregiversCount,
        alerts: alertsCount
      });
    } catch (err) {
      console.error("Dashboard stats error:", err);
      res.status(500).json({ error: "Failed to load dashboard stats" });
    }
  }
);

module.exports = router;
