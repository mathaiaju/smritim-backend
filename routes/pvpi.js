const express = require("express");
const router = express.Router();
const db = require("../models");
const auth = require("../middleware/auth");

/* =====================================================
   GET /api/pvpi
   List PvPI cases
===================================================== */
router.get(
  "/",
  auth(["hospital_admin", "clinician", "patient"]),
  async (req, res) => {
    try {
      const { role, linked_id, hospital_id } = req.user;

      const where = { hospital_id };

      // Patient → only own cases
      if (role === "patient") {
        where.user_id = linked_id;
      }

      // Clinician → only linked patients
      if (role === "clinician") {
        const links = await db.PatientClinicianLink.findAll({
          where: { clinician_id: linked_id }
        });

        const patientIds = links.map(l => l.user_id);
        if (patientIds.length === 0) {
          return res.json([]);
        }
        where.user_id = patientIds;
      }

      const cases = await db.PvpiCase.findAll({
        where,
        include: [
          db.User,
          db.Medication,
          db.MedicationSchedule
        ],
        order: [["id", "DESC"]],
        limit: 200
      });

      res.json(cases);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "server error" });
    }
  }
);

/* =====================================================
   GET /api/pvpi/:id
===================================================== */
router.get(
  "/:id",
  auth(["hospital_admin", "clinician", "patient"]),
  async (req, res) => {
    try {
      const { role, linked_id, hospital_id } = req.user;

      const pvpiCase = await db.PvpiCase.findOne({
        where: {
          id: req.params.id,
          hospital_id
        },
        include: [
          db.User,
          db.Medication,
          db.MedicationSchedule
        ]
      });

      if (!pvpiCase) {
        return res.status(404).json({ error: "PvPI case not found" });
      }

      // Patient can only see own
      if (role === "patient" && pvpiCase.user_id !== linked_id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Clinician must be linked to patient
      if (role === "clinician") {
        const link = await db.PatientClinicianLink.findOne({
          where: {
            clinician_id: linked_id,
            user_id: pvpiCase.user_id
          }
        });
        if (!link) {
          return res.status(403).json({ error: "Forbidden" });
        }
      }

      res.json(pvpiCase);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "server error" });
    }
  }
);

/* =====================================================
   POST /api/pvpi/submit
   Submit case to PvPI (Hospital admin / AMC)
===================================================== */
router.post(
  "/submit",
  auth(["hospital_admin"]),
  async (req, res) => {
    try {
      const { case_id } = req.body;

      if (!case_id) {
        return res.status(400).json({
          error: "case_id is required"
        });
      }

      const pvpiCase = await db.PvpiCase.findOne({
        where: {
          id: case_id,
          hospital_id: req.user.hospital_id
        }
      });

      if (!pvpiCase) {
        return res.status(404).json({ error: "PvPI case not found" });
      }

      if (pvpiCase.submitted_to_pvpi) {
        return res.status(400).json({
          error: "Case already submitted"
        });
      }

      await pvpiCase.update({
        submitted_to_pvpi: true,
        submitted_at: new Date(),
        verified_by: req.user.id
      });

      await db.PvpiReviewLog.create({
        case_id,
        reviewer_id: req.user.id,
        action: "verified",
        notes: "Submitted to PvPI via MediRaksha"
      });

      res.json({
        message: "PvPI case submitted successfully",
        case_id
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "server error" });
    }
  }
);

/* =====================================================
   POST /api/pvpi/from-alert
   Clinician creates PvPI case from alert
===================================================== */
router.post(
  "/from-alert",
  auth(["clinician"]),
  async (req, res) => {
    try {
      // Map 'critical' to 'serious' for seriousness
      let { alert_id, seriousness = "serious" } = req.body;
      if (seriousness === 'critical') seriousness = 'serious';
      const { linked_id: clinician_id, hospital_id } = req.user;

      if (!alert_id) {
        return res.status(400).json({ error: "alert_id is required" });
      }

      /* =========================
         Load alert
      ========================= */
      const alert = await db.Alert.findOne({
        where: { id: alert_id, hospital_id }
      });

      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }

      /* =========================
         Verify clinician–patient link
      ========================= */
      const link = await db.PatientClinicianLink.findOne({
        where: {
          clinician_id,
          user_id: alert.user_id
        }
      });

      if (!link) {
        return res.status(403).json({
          error: "Clinician not linked to patient"
        });
      }

      /* =========================
         Prevent duplicate PvPI
      ========================= */
      const existing = await db.PvpiCase.findOne({
        where: {
          user_id: alert.user_id,
          medication_id: alert.medication_id,
          log_date: db.Sequelize.literal("CURDATE()")
        }
      });

      if (existing) {
        return res.status(400).json({
          error: "PvPI case already exists for this event"
        });
      }

      /* =========================
         Create PvPI case
      ========================= */
      const pvpiCase = await db.PvpiCase.create({
        hospital_id,
        user_id: alert.user_id,
        medication_id: alert.medication_id,
        medication_schedule_id: alert.medication_schedule_id,
        log_date: new Date(),
        original_term: alert.description,
        seriousness,
        outcome: "ongoing",
        submitted_to_pvpi: false,
        adr_description: req.body.adr_description,
        suspected_drug: req.body.suspected_drug,
        reaction_outcome: req.body.reaction_outcome,
        reporter_name: req.body.reporter_name,
        reporter_contact: req.body.reporter_contact,
        hospital_name: req.body.hospital_name,
        action_taken: req.body.action_taken
      });

      /* =========================
         Create review log
      ========================= */
      await db.PvpiReviewLog.create({
        case_id: pvpiCase.id,
        reviewer_id: clinician_id,
        action: "pending",
        notes: "Clinician validated ADR from alert"
      });

      res.status(201).json({
        message: "PvPI case created by clinician",
        pvpi_case_id: pvpiCase.id
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "server error" });
    }
  }
);


module.exports = router;
