const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const db = require("../models");
const bcrypt = require("bcryptjs");

/* =====================================================
   HELPERS
===================================================== */

function cleanUser(user) {
  const u = user.toJSON();

  // Age
  if (u.date_of_birth) {
    const dob = new Date(u.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    u.age = age;
  } else {
    u.age = null;
  }

  // Weight
  u.weight_kg = u.weight_kg ?? null;

  return u;
}


/* =====================================================
   GET /api/users
   List users (patients) in admin's hospital
   Supports ?count=true
===================================================== */
router.get(
  "/",
  auth(["hospital_admin"]),
  async (req, res) => {
    try {
      const { hospital_id } = req.user;
      const { count } = req.query;

      const where = {
        hospital_id
        //is_active: true
      };

      if (count === "true") {
        const total = await db.User.count({ where });
        return res.json({ count: total });
      }

      const users = await db.User.findAll({
        where,
        order: [["created_at", "DESC"]]
      });

      res.json({
        count: users.length,
        users: users.map(cleanUser)
      });
    } catch (err) {
      console.error("List users error:", err);
      res.status(500).json({ error: "Failed to list users" });
    }
  }
);

/* =====================================================
   GET /api/users/:id
   Get single patient (hospital scoped)
===================================================== */
router.get(
  "/:id",
  auth(["hospital_admin"]),
  async (req, res) => {
    try {
      const { hospital_id } = req.user;

      const user = await db.User.findOne({
        where: {
          id: req.params.id,
          hospital_id
          //is_active: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: "Patient not found" });
      }

      res.json(cleanUser(user));
    } catch (err) {
      console.error("Get user error:", err);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  }
);

/* =====================================================
   PUT /api/users/:id
   Update patient details
===================================================== */
router.put(
  "/:id",
  auth(["hospital_admin"]),
  async (req, res) => {
    try {
      const { hospital_id } = req.user;
     const {
        full_name,
        phone,
        locale,
        emergency_contact,
        date_of_birth,
        weight_kg
      } = req.body;


      const user = await db.User.findOne({
        where: {
          id: req.params.id,
          hospital_id
          //is_active: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: "Patient not found" });
      }

    await user.update({
        full_name,
        phone,
        locale,
        emergency_contact,
        date_of_birth,
        weight_kg
      });


      res.json({
        message: "Patient updated successfully",
        user: cleanUser(user)
      });
    } catch (err) {
      console.error("Update user error:", err);
      res.status(500).json({ error: "Failed to update user" });
    }
  }
);

/* =====================================================
   DELETE /api/users/:id
   Soft delete patient + disable login
===================================================== */
router.delete(
  "/:id",
  auth(["hospital_admin"]),
  async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
      const { hospital_id } = req.user;

      const user = await db.User.findOne({
        where: {
          id: req.params.id,
          hospital_id
          //is_active: true
        },
        transaction: t
      });

      if (!user) {
        await t.rollback();
        return res.status(404).json({ error: "Patient not found" });
      }

      // Soft delete patient
      await user.update({ transaction: t });

      // Disable auth login
      await db.AuthUser.update(
         {
          where: {
            role: "patient",
            linked_id: user.id,
            hospital_id
          },
          transaction: t
        }
      );

      await t.commit();

      res.json({ message: "Patient deleted successfully" });
    } catch (err) {
      await t.rollback();
      console.error("Delete user error:", err);
      res.status(500).json({ error: "Failed to delete user" });
    }
  }
);

/* =====================================================
   ONBOARD PATIENT
===================================================== */
router.post(
  "/onboard/patient",
  auth(["hospital_admin"]),
  async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
    const {
        full_name,
        phone,
        locale,
        emergency_contact,
        date_of_birth,
        weight_kg,
        username,
        password
      } = req.body;


     const user = await db.User.create(
        {
          hospital_id: req.user.hospital_id,
          full_name,
          phone,
          locale,
          emergency_contact,
          date_of_birth,
          weight_kg
        },
        { transaction: t }
      );


      const hash = await bcrypt.hash(password, 10);

      await db.AuthUser.create(
        {
          hospital_id: req.user.hospital_id,
          username,
          password_hash: hash,
          role: "patient",
          linked_id: user.id
          //is_active: true
        },
        { transaction: t }
      );

      await t.commit();

      res.status(201).json({
        message: "Patient onboarded",
        patient_id: user.id
      });
    } catch (err) {
      await t.rollback();
      console.error(err);
      res.status(500).json({ error: "Onboarding failed" });
    }
  }
);

/* =====================================================
   ONBOARD CLINICIAN
===================================================== */
router.post(
  "/onboard/clinician",
  auth(["hospital_admin"]),
  async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
      const {
        full_name,
        email,
        phone,
        role = "doctor",
        username,
        password
      } = req.body;

      if (!full_name || !phone || !username || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // 1️⃣ Create clinician domain record
      const clinician = await db.ClinicianUser.create(
        {
          hospital_id: req.user.hospital_id,
          full_name,
          email,
          phone,
          role
        },
        { transaction: t }
      );

      // 2️⃣ Create auth user
      const hash = await bcrypt.hash(password, 10);

      await db.AuthUser.create(
        {
          hospital_id: req.user.hospital_id,
          username,
          password_hash: hash,
          role: "clinician",
          linked_id: clinician.id
        },
        { transaction: t }
      );

      await t.commit();

      res.status(201).json({
        message: "Clinician onboarded",
        clinician_id: clinician.id
      });
    } catch (err) {
      await t.rollback();
      console.error("Onboard clinician error:", err);
      res.status(500).json({ error: "Onboarding failed" });
    }
  }
);
/* =====================================================
   GET /api/users/:id/clinicians
   Get clinicians linked to a patient (ADMIN)
===================================================== */
router.get(
  "/:id/clinicians",
  auth(["hospital_admin"]),
  async (req, res) => {
    try {
      const { hospital_id } = req.user;
      const user_id = req.params.id;

      // ensure patient exists in hospital
      const patient = await db.User.findOne({
        where: { id: user_id, hospital_id }
      });

      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      const links = await db.PatientClinicianLink.findAll({
        where: { user_id },
        include: [
          {
            model: db.ClinicianUser,
            attributes: ["id", "full_name", "phone", "role"]
          }
        ]
      });

      res.json(
        links.map(l => ({
          clinician_id: l.clinician_id,
          relationship: l.relationship,
          clinician: l.ClinicianUser
        }))
      );
    } catch (err) {
      console.error("Get patient clinicians error:", err);
      res.status(500).json({ error: "Failed to fetch clinicians" });
    }
  }
);

/* =====================================================
   ONBOARD CAREGIVER
===================================================== */
router.post(
  "/onboard/caregiver",
  auth(["hospital_admin"]),
  async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
      const {
        full_name,
        phone,
        relation,
        username,
        password
      } = req.body;

      if (!full_name || !phone || !username || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // 1️⃣ Create caregiver domain record
      const caregiver = await db.Caregiver.create(
        {
          hospital_id: req.user.hospital_id,
          full_name,
          phone,
          relation
        },
        { transaction: t }
      );

      // 2️⃣ Create auth user
      const hash = await bcrypt.hash(password, 10);

      await db.AuthUser.create(
        {
          hospital_id: req.user.hospital_id,
          username,
          password_hash: hash,
          role: "caregiver",
          linked_id: caregiver.id
        },
        { transaction: t }
      );

      await t.commit();

      res.status(201).json({
        message: "Caregiver onboarded",
        caregiver_id: caregiver.id
      });
    } catch (err) {
      await t.rollback();
      console.error("Onboard caregiver error:", err);
      res.status(500).json({ error: "Onboarding failed" });
    }
  }
);


/* =====================================================
   PATIENT ↔ CLINICIAN LINK
===================================================== */
router.post(
  "/patient-clinician",
  auth(["hospital_admin"]),
  async (req, res) => {
    try {
      const { user_id, clinician_id, relationship = "primary" } = req.body;
      const { hospital_id } = req.user;

      if (!user_id || !clinician_id) {
        return res.status(400).json({
          error: "user_id and clinician_id are required"
        });
      }

      const patient = await db.User.findOne({
        where: { id: user_id, hospital_id }
      });
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      const clinician = await db.ClinicianUser.findOne({
        where: { id: clinician_id, hospital_id }
      });
      if (!clinician) {
        return res.status(404).json({ error: "Clinician not found" });
      }

      const existing = await db.PatientClinicianLink.findOne({
        where: { user_id, clinician_id }
      });
      if (existing) {
        return res.status(409).json({
          error: "Patient already linked to this clinician"
        });
      }

      const link = await db.PatientClinicianLink.create({
        user_id,
        clinician_id,
        relationship
      });

      res.status(201).json({
        message: "Patient successfully linked to clinician",
        link: {
          id: link.id,
          user_id,
          clinician_id,
          relationship,
          clinician: {
            id: clinician.id,
            full_name: clinician.full_name,
            phone: clinician.phone,
            role: clinician.role
          }
        }
      });
    } catch (err) {
      console.error("Patient–Clinician link error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/* =====================================================
   GET /api/users/patients-dropdown
   Lightweight list for dropdowns (ADMIN)
===================================================== */
router.get(
  "/patients-dropdown",
  auth(["hospital_admin"]),
  async (req, res) => {
    try {
      const { hospital_id } = req.user;

      const patients = await db.User.findAll({
        where: { hospital_id },
        attributes: ["id", "full_name", "phone"],
        order: [["full_name", "ASC"]]
      });

      res.json(patients);
    } catch (err) {
      console.error("Patients dropdown error:", err);
      res.status(500).json({ error: "Failed to fetch patients" });
    }
  }
);


/* =====================================================
   PATIENT ↔ CAREGIVER LINK
===================================================== */
router.post(
  "/patient-caregiver",
  auth(["hospital_admin"]),
  async (req, res) => {
    try {
      const {
        user_id,
        caregiver_id,
        notify_missed = true,
        notify_redflag = true,
        relationship = "primary"
      } = req.body;
      const { hospital_id } = req.user;

      if (!user_id || !caregiver_id) {
        return res.status(400).json({
          error: "user_id and caregiver_id are required"
        });
      }

      const patient = await db.User.findOne({
        where: { id: user_id, hospital_id }
      });
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      const caregiver = await db.Caregiver.findOne({
        where: { id: caregiver_id, hospital_id }
      });
      if (!caregiver) {
        return res.status(404).json({ error: "Caregiver not found" });
      }

      const existing = await db.PatientCaregiverLink.findOne({
        where: { user_id, caregiver_id }
      });
      if (existing) {
        return res.status(409).json({
          error: "Caregiver already linked to this patient"
        });
      }

      const link = await db.PatientCaregiverLink.create({
        hospital_id,
        user_id,
        caregiver_id,
        notify_missed,
        notify_redflag,
        relationship
      });

      res.status(201).json({
        message: "Caregiver successfully linked to patient",
        link: {
          id: link.id,
          user_id,
          caregiver_id,
          relationship,
          notify_missed,
          notify_redflag,
          caregiver: {
            id: caregiver.id,
            full_name: caregiver.full_name,
            phone: caregiver.phone,
            relation: caregiver.relation
          }
        }
      });
    } catch (err) {
      console.error("Patient–Caregiver link error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);



module.exports = router;
