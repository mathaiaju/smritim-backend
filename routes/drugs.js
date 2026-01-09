const express = require("express");
const router = express.Router();
const { Rule } = require("../models");
const { Op, fn, col, where } = require("sequelize");

/**
 * GET /drugs/search?q=flu
 */
router.get("/search", async (req, res) => {
  const q = (req.query.q || "").trim();

  if (q.length < 2) {
    return res.json({ drugs: [] });
  }

  try {
    const rows = await Rule.findAll({
      attributes: [
        [fn("DISTINCT", col("drug_name")), "drug_name"]
      ],
      where: {
        active: true,
        drug_name: {
          [Op.ne]: null,
        },
        // ✅ MYSQL SAFE CASE-INSENSITIVE SEARCH
        [Op.and]: where(
          fn("LOWER", col("drug_name")),
          {
            [Op.like]: `%${q.toLowerCase()}%`
          }
        ),
      },
      order: [[col("drug_name"), "ASC"]],
      limit: 20,
      raw: true,
    });

    res.json({
      drugs: rows.map(r => r.drug_name),
    });
  } catch (e) {
    console.error("❌ Drug search failed", e);
    res.status(500).json({ error: "Failed to search drugs" });
  }
});

/**
 * GET /drugs/:drug/symptoms
 */
router.get("/:drug/symptoms", async (req, res) => {
  const drug = req.params.drug;

  try {
    const rows = await Rule.findAll({
      attributes: ["symptom"],
      where: {
        active: true,
        drug_name: drug,
      },
      raw: true,
    });

    const symptoms = [
      ...new Set(
        rows
          .map(r => r.symptom)
          .filter(Boolean)
          .flatMap(s => s.split(/[,;+]/))
          .map(s => s.trim())
      ),
    ];

    res.json({ symptoms });
  } catch (e) {
    console.error("❌ Symptom fetch failed", e);
    res.status(500).json({ error: "Failed to load symptoms" });
  }
});


module.exports = router;
