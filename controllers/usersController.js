const db = require("../models");

/* =====================================================
   Create User
===================================================== */
exports.create = async (req, res) => {
  try {
    const { phone, full_name, locale, emergency_contact } = req.body;
    const { hospital_id } = req.user;

    if (!phone) {
      return res.status(400).json({ error: "phone is required" });
    }

    const user = await db.User.create({
      phone,
      full_name,
      locale,
      emergency_contact,
      hospital_id
    });

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create user" });
  }
};

/* =====================================================
   List Users (Hospital Scoped)
===================================================== */
exports.list = async (req, res) => {
  try {
    const { hospital_id } = req.user;

    const users = await db.User.findAll({
      where: { hospital_id },
      attributes: ["id", "full_name", "phone", "locale"]
    });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

/* =====================================================
   Get User By ID
===================================================== */
exports.getById = async (req, res) => {
  try {
    const { hospital_id } = req.user;

    const user = await db.User.findOne({
      where: {
        id: req.params.id,
        hospital_id
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
