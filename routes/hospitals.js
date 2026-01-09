const express = require("express");
const router = express.Router();
const db = require("../models");
const auth = require("../middleware/auth");


/* =====================================================
   POST /api/hospitals
   Create hospital (SUPER ADMIN ONLY)
===================================================== */
router.post(
  "/",
  auth(["hospital_admin"]), // 🔐 IMPORTANT
  async (req, res) => {
    try {
      const { name, code, contact_email, contact_phone } = req.body;

      if (!name || !code) {
        return res.status(400).json({
          error: "name and code are required"
        });
      }

      const existing = await db.Hospital.findOne({
        where: { code }
      });

      if (existing) {
        return res.status(409).json({
          error: "Hospital code already exists"
        });
      }

      const hospital = await db.Hospital.create({
        name,
        code,
        contact_email,
        contact_phone,
        active: true
      });

      res.status(201).json(hospital);
    } catch (err) {
      console.error("Create hospital error:", err);
      res.status(500).json({ error: "Failed to create hospital" });
    }
  }
);

/* =====================================================
   GET /api/hospitals
===================================================== */
router.get(
  "/",
  auth(["hospital_admin", "hospital_admin"]),
  async (req, res) => {
    try {
      // Hospital admin → only own hospital
      /*if (req.user.role === "hospital_admin") {
        const hospital = await db.Hospital.findByPk(
          req.user.hospital_id
        );
        return res.json(hospital ? [hospital] : []);
      }*/

      // Super admin → all hospitals
      const hospitals = await db.Hospital.findAll({
        where: { active: true },
        order: [["id", "ASC"]]
      });

      res.json(hospitals);
    } catch (err) {
      console.error("Fetch hospitals error:", err);
      res.status(500).json({ error: "Failed to fetch hospitals" });
    }
  }
);

module.exports = router;
