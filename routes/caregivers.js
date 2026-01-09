const express = require("express");
const router = express.Router();
const db = require("../models");
const auth = require("../middleware/auth");
const bcrypt = require("bcryptjs");

/* =====================================================
   GET /api/caregivers
   Admin – list caregivers
   ?count=true supported
===================================================== */
router.get("/", auth(["hospital_admin"]), async (req, res) => {
  try {
    const { hospital_id } = req.user;
    const { count } = req.query;

    const where = {
      hospital_id
      //is_active: true
    };

    if (count === "true") {
      const total = await db.Caregiver.count({ where });
      return res.json({ count: total });
    }

    const caregivers = await db.Caregiver.findAll({
      where,
      attributes: ["id", "full_name", "phone", "relation"]
      
    });

    res.json({ count: caregivers.length, caregivers });
  } catch (err) {
    console.error("List caregivers error:", err);
    res.status(500).json({ error: "server error" });
  }
});

/* =====================================================
   GET /api/caregivers/:id
   Admin – get caregiver
===================================================== */
router.get("/:id", auth(["hospital_admin"]), async (req, res) => {
  try {
    const caregiver = await db.Caregiver.findOne({
      where: {
        id: req.params.id,
        hospital_id: req.user.hospital_id
        //is_active: true
      }
    });

    if (!caregiver) {
      return res.status(404).json({ error: "Caregiver not found" });
    }

    res.json(caregiver);
  } catch (err) {
    console.error("Get caregiver error:", err);
    res.status(500).json({ error: "server error" });
  }
});

/* =====================================================
   POST /api/caregivers
   Admin – create caregiver + auth user
===================================================== */
router.post("/", auth(["hospital_admin"]), async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { full_name, phone, relation, username, password } = req.body;

    if (!full_name || !phone || !username || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const caregiver = await db.Caregiver.create(
      {
        hospital_id: req.user.hospital_id,
        full_name,
        phone,
        relation
        //is_active: true
      },
      { transaction: t }
    );

    const password_hash = await bcrypt.hash(password, 10);

    await db.AuthUser.create(
      {
        hospital_id: req.user.hospital_id,
        username,
        password_hash,
        role: "caregiver",
        linked_id: caregiver.id
        //is_active: true
      },
      { transaction: t }
    );

    await t.commit();

    res.status(201).json({
      message: "Caregiver created successfully",
      caregiver
    });
  } catch (err) {
    await t.rollback();
    console.error("Create caregiver error:", err);
    res.status(500).json({ error: "server error" });
  }
});

/* =====================================================
   PUT /api/caregivers/:id
   Admin – update caregiver
===================================================== */
router.put("/:id", auth(["hospital_admin"]), async (req, res) => {
  try {
    const { full_name, phone, relation } = req.body;

    const caregiver = await db.Caregiver.findOne({
      where: {
        id: req.params.id,
        hospital_id: req.user.hospital_id
        //is_active: true
      }
    });

    if (!caregiver) {
      return res.status(404).json({ error: "Caregiver not found" });
    }

    await caregiver.update({ full_name, phone, relation });

    res.json({
      message: "Caregiver updated successfully",
      caregiver
    });
  } catch (err) {
    console.error("Update caregiver error:", err);
    res.status(500).json({ error: "server error" });
  }
});

/* =====================================================
   DELETE /api/caregivers/:id
   Admin – soft delete caregiver + disable login
===================================================== */
router.delete("/:id", auth(["hospital_admin"]), async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const caregiver = await db.Caregiver.findOne({
      where: {
        id: req.params.id,
        hospital_id: req.user.hospital_id
        //is_active: true
      },
      transaction: t
    });

    if (!caregiver) {
      await t.rollback();
      return res.status(404).json({ error: "Caregiver not found" });
    }

    await caregiver.update({ is_active: false }, { transaction: t });

    await db.AuthUser.update(
      
      {
        where: {
          role: "caregiver",
          linked_id: caregiver.id,
          hospital_id: req.user.hospital_id
        },
        transaction: t
      }
    );

    await t.commit();
    res.json({ message: "Caregiver deleted successfully" });
  } catch (err) {
    await t.rollback();
    console.error("Delete caregiver error:", err);
    res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
