const express = require("express");
const router = express.Router();
const db = require("../models");
const auth = require("../middleware/auth");
const { Op } = require("sequelize");

/* =====================================================
   POST /api/meds
===================================================== */
router.post(
  "/",
  auth(["hospital_admin", "clinician"]),
  async (req, res) => {
    try {
      const {
        user_id,
        drug_name_generic,
        drug_name_brand,
        indication,
        start_date,
        stop_date
      } = req.body;

      const { hospital_id } = req.user;

      if (!user_id || !drug_name_generic) {
        return res.status(400).json({
          error: "user_id and drug_name_generic are required"
        });
      }

      const patient = await db.User.findOne({
        where: { id: user_id, hospital_id }
      });

      if (!patient) {
        return res.status(404).json({
          error: "Patient not found or unauthorized"
        });
      }

      const med = await db.Medication.create({
        hospital_id,
        user_id,
        drug_name_generic,
        drug_name_brand,
        indication,
        start_date,
        stop_date: stop_date || null
      });

      res.status(201).json(med);
    } catch (err) {
      console.error("Add medication error:", err);
      res.status(500).json({ error: "server error" });
    }
  }
);

/* =====================================================
   GET /api/meds   ✅ FINAL FIX
===================================================== */
router.get(
  "/",
  auth(["patient", "clinician", "hospital_admin"]),
  async (req, res) => {
    try {
      // 🚫 prevent 304 / cached empty responses
      res.set("Cache-Control", "no-store");

      const { user_id, active = "true" } = req.query;
      const { role, linked_id, hospital_id } = req.user;

      const where = {};

      /* ============ HOSPITAL FILTER ============ */
      if (hospital_id !== undefined && hospital_id !== null) {
        where.hospital_id = hospital_id;
      }

      /* ============ ROLE FILTERING ============ */

      if (role === "patient") {
        where.user_id = linked_id;
      }

      if (role === "clinician") {
        if (user_id) {
          const link = await db.PatientClinicianLink.findOne({
            where: {
              clinician_id: linked_id,
              user_id
            }
          });
          if (!link) {
            return res.status(403).json({ error: "Forbidden" });
          }
          where.user_id = user_id;
        } else {
          const links = await db.PatientClinicianLink.findAll({
            where: { clinician_id: linked_id }
          });

          where.user_id = {
            [Op.in]: links.map(l => l.user_id)
          };
        }
      }

      if (role === "hospital_admin" && user_id) {
        where.user_id = user_id;
      }

      /* ============ ACTIVE MEDICATION LOGIC (FIX) ============ */
      if (active === "true") {
        where[Op.or] = [
          { stop_date: null },
          { stop_date: { [Op.gte]: new Date() } }
        ];
      }

      console.log("🧪 MED QUERY WHERE =", where);

      /* ============ DB QUERY ============ */
      const meds = await db.Medication.findAll({
        where,
        include: [
          {
            model: db.MedicationSchedule,
            required: false
          }
        ],
        order: [["id", "DESC"]]
      });

      /* ============ POST-PROCESS ============ */
      const response = meds.map(med => {
        const json = med.toJSON();
        return {
          ...json,
          MedicationSchedules: (json.MedicationSchedules || []).filter(
            s => s.active === true
          )
        };
      });

      res.json(response);
    } catch (err) {
      console.error("Get medications error:", err);
      res.status(500).json({ error: "server error" });
    }
  }
);

/* =====================================================
   GET /api/meds/:id
===================================================== */
router.get(
  "/:id",
  auth(["patient", "clinician", "hospital_admin"]),
  async (req, res) => {
    try {
      const { role, linked_id, hospital_id } = req.user;

      const med = await db.Medication.findOne({
        where: {
          id: req.params.id,
          hospital_id
        },
        include: db.MedicationSchedule
      });

      if (!med) {
        return res.status(404).json({ error: "Medication not found" });
      }

      if (role === "patient" && med.user_id !== linked_id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      if (role === "clinician") {
        const link = await db.PatientClinicianLink.findOne({
          where: {
            clinician_id: linked_id,
            user_id: med.user_id
          }
        });
        if (!link) {
          return res.status(403).json({ error: "Forbidden" });
        }
      }

      res.json(med);
    } catch (err) {
      console.error("Get medication error:", err);
      res.status(500).json({ error: "server error" });
    }
  }
);

/* =====================================================
   PUT /api/meds/:id
===================================================== */
router.put(
  "/:id",
  auth(["hospital_admin", "clinician"]),
  async (req, res) => {
    try {
      const med = await db.Medication.findOne({
        where: {
          id: req.params.id,
          hospital_id: req.user.hospital_id
        }
      });

      if (!med) {
        return res.status(404).json({ error: "Medication not found" });
      }

      const allowedFields = [
        "drug_name_generic",
        "drug_name_brand",
        "indication",
        "start_date",
        "stop_date"
      ];

      const updates = {};
      for (const f of allowedFields) {
        if (req.body[f] !== undefined) updates[f] = req.body[f];
      }

      await med.update(updates);
      res.json(med);
    } catch (err) {
      console.error("Update medication error:", err);
      res.status(500).json({ error: "server error" });
    }
  }
);

/* =====================================================
   DELETE /api/meds/:id   (Soft stop)
===================================================== */
router.delete(
  "/:id",
  auth(["hospital_admin", "clinician"]),
  async (req, res) => {
    try {
      const med = await db.Medication.findOne({
        where: {
          id: req.params.id,
          hospital_id: req.user.hospital_id
        }
      });

      if (!med) {
        return res.status(404).json({ error: "Medication not found" });
      }

      await med.update({ stop_date: new Date() });

      res.json({
        message: "Medication stopped",
        medication_id: med.id
      });
    } catch (err) {
      console.error("Stop medication error:", err);
      res.status(500).json({ error: "server error" });
    }
  }
);

module.exports = router;
