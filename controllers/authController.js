const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../models");

exports.login = async (req, res) => {
  const { username, password } = req.body;

  const user = await db.AuthUser.findOne({ where: { username, active: true }});
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    {
      auth_id: user.id,
      role: user.role,
      linked_id: user.linked_id
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.json({
    token,
    role: user.role
  });
};
