const express = require("express");
const router = express.Router();
const db = require("../models");
const auth = require("../middleware/auth");


/* =====================================================
   POST /api/medication-schedules
   Create a medication schedule
===================================================== */
router.post(
  "/",
  auth(["hospital_admin", "clinician"]),
  async (req, res) => {
    try {
      const {
        medication_id,
        dose,
        time_of_day,
        scheduled_time,
        before_food = false,
        after_food = true
      } = req.body;

      const { hospital_id } = req.user;

      if (!medication_id || !dose || !time_of_day) {
        return res.status(400).json({
          error: "medication_id, dose, and time_of_day are required"
        });
      }

      const med = await db.Medication.findOne({
        where: {
          id: medication_id,
          hospital_id
        }
      });

      if (!med) {
        return res.status(404).json({
          error: "Medication not found or unauthorized"
        });
      }

      const schedule = await db.MedicationSchedule.create({
        medication_id,
        dose,
        time_of_day,
        scheduled_time,
        before_food,
        after_food
      });

      res.status(201).json(schedule);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "server error" });
    }
  }
);

/* =====================================================
   GET /api/medication-schedules?medication_id=1
===================================================== */
router.get(
  "/",
  auth(["patient", "clinician", "hospital_admin"]),
  async (req, res) => {
    try {
      const { medication_id } = req.query;
      const { role, linked_id, hospital_id } = req.user;

      if (!medication_id) {
        return res.status(400).json({
          error: "medication_id query param is required"
        });
      }

      const med = await db.Medication.findOne({
        where: { id: medication_id, hospital_id }
      });

      if (!med) {
        return res.status(404).json({ error: "Medication not found" });
      }

      // PATIENT → own meds only
      if (role === "patient" && med.user_id !== linked_id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // CLINICIAN → linked patients only
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

      const schedules = await db.MedicationSchedule.findAll({
        where: { medication_id, active: true },
        order: [["id", "ASC"]]
      });

      res.json(schedules);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "server error" });
    }
  }
);

/* =====================================================
   GET /api/medication-schedules/:id
===================================================== */
router.get(
  "/:id",
  auth(["patient", "clinician", "hospital_admin"]),
  async (req, res) => {
    try {
      const schedule = await db.MedicationSchedule.findByPk(req.params.id, {
        include: db.Medication
      });

      if (!schedule || !schedule.Medication) {
        return res.status(404).json({ error: "Schedule not found" });
      }

      const { role, linked_id, hospital_id } = req.user;
      const med = schedule.Medication;

      if (med.hospital_id !== hospital_id) {
        return res.status(403).json({ error: "Forbidden" });
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

      res.json(schedule);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "server error" });
    }
  }
);

/* =====================================================
   PUT /api/medication-schedules/:id
===================================================== */
router.put(
  "/:id",
  auth(["hospital_admin", "clinician"]),
  async (req, res) => {
    try {
      const schedule = await db.MedicationSchedule.findByPk(req.params.id, {
        include: db.Medication
      });

      if (!schedule || !schedule.Medication) {
        return res.status(404).json({ error: "Schedule not found" });
      }

      if (schedule.Medication.hospital_id !== req.user.hospital_id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await schedule.update(req.body);
      res.json(schedule);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "server error" });
    }
  }
);

/* =====================================================
   DELETE /api/medication-schedules/:id
   Soft delete
===================================================== */
router.delete(
  "/:id",
  auth(["hospital_admin", "clinician"]),
  async (req, res) => {
    try {
      const schedule = await db.MedicationSchedule.findByPk(req.params.id, {
        include: db.Medication
      });

      if (!schedule || !schedule.Medication) {
        return res.status(404).json({ error: "Schedule not found" });
      }

      if (schedule.Medication.hospital_id !== req.user.hospital_id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await schedule.update({ active: false });
      res.json({ message: "Schedule deactivated" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "server error" });
    }
  }
);

module.exports = router;
