const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../models");
const auth = require("../middleware/auth");

/* =====================================================
   POST /api/auth/login
===================================================== */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "username and password required" });
    }

    const user = await db.AuthUser.findOne({
      where: {
        username,
        active: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid =
      password === "password" || // DEV BACKDOOR (REMOVE IN PROD)
      (user.password_hash &&
        (await bcrypt.compare(password, user.password_hash)));

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        hospital_id: user.hospital_id,
        linked_id: user.linked_id
      },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "8h" }
    );

    res.json({
      token,
      role: user.role,
      hospital_id: user.hospital_id
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "login failed" });
  }
});

/* =====================================================
   GET /api/auth/admins
   List admins in hospital
   ?count=true supported
===================================================== */
router.get(
  "/admins",
  auth(["hospital_admin"]),
  async (req, res) => {
    try {
      const { count } = req.query;

      const where = {
        hospital_id: req.user.hospital_id,
        role: "hospital_admin",
        active: true
      };

      if (count === "true") {
        const total = await db.AuthUser.count({ where });
        return res.json({ count: total });
      }

      const admins = await db.AuthUser.findAll({
        where,
        attributes: ["id", "username", "created_at"],
        order: [["created_at", "DESC"]]
      });

      res.json({ count: admins.length, admins });
    } catch (err) {
      console.error("List admins error:", err);
      res.status(500).json({ error: "server error" });
    }
  }
);

/* =====================================================
   POST /api/auth/admins
   Create hospital admin
===================================================== */
router.post(
  "/admins",
  auth(["hospital_admin"]),
  async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Missing fields" });
      }

      const hash = await bcrypt.hash(password, 10);

      const admin = await db.AuthUser.create({
        hospital_id: req.user.hospital_id,
        username,
        password_hash: hash,
        role: "hospital_admin",
        linked_id: 0,
        active: true
      });

      res.status(201).json({
        message: "Admin created successfully",
        admin: {
          id: admin.id,
          username: admin.username
        }
      });
    } catch (err) {
      console.error("Create admin error:", err);
      res.status(500).json({ error: "server error" });
    }
  }
);

/* =====================================================
   PUT /api/auth/admins/:id
   Update admin (password reset / username)
===================================================== */
router.put(
  "/admins/:id",
  auth(["hospital_admin"]),
  async (req, res) => {
    try {
      const { username, password } = req.body;

      const admin = await db.AuthUser.findOne({
        where: {
          id: req.params.id,
          hospital_id: req.user.hospital_id,
          role: "hospital_admin",
          active: true
        }
      });

      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }

      const update = {};
      if (username) update.username = username;
      if (password) update.password_hash = await bcrypt.hash(password, 10);

      await admin.update(update);

      res.json({ message: "Admin updated successfully" });
    } catch (err) {
      console.error("Update admin error:", err);
      res.status(500).json({ error: "server error" });
    }
  }
);

/* =====================================================
   DELETE /api/auth/admins/:id
   Soft delete admin
===================================================== */
router.delete(
  "/admins/:id",
  auth(["hospital_admin"]),
  async (req, res) => {
    try {
      const admin = await db.AuthUser.findOne({
        where: {
          id: req.params.id,
          hospital_id: req.user.hospital_id,
          role: "hospital_admin",
          active: true
        }
      });

      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }

      await admin.update({ active: false });

      res.json({ message: "Admin disabled successfully" });
    } catch (err) {
      console.error("Delete admin error:", err);
      res.status(500).json({ error: "server error" });
    }
  }
);

module.exports = router;
