const express = require("express");
const router = express.Router();
const { Rule } = require("../models");
const { Op, fn, col, where } = require("sequelize");


/**
 * GET /drugs/search?q=ze&lang=en|ml
 */

router.get("/search", async (req, res) => {
  try {
    let q = (req.query.q || "").toLowerCase().trim();

    console.log("🔍 /drugs/search called");
    console.log("➡️ raw query:", req.query.q);
    console.log("➡️ normalized query (before phonetic):", q);

    // 🔒 Guard
    if (q.length < 2) {
      console.log("⛔ Query too short, returning empty");
      return res.json([]);
    }

    // 🔑 Phonetic normalization
    q = q
      .replace(/^ze/, "za")
      .replace(/^zi/, "za");

    console.log("➡️ normalized query (after phonetic):", q);

    // 🔎 Sanity: total active rules
    const totalRules = await Rule.count({ where: { active: true } });
    console.log("📊 total active rules:", totalRules);

    // 🔎 Sanity: sample drug names
    const sample = await Rule.findAll({
      attributes: ["drug_name"],
      where: { active: true },
      limit: 5,
      raw: true,
    });
    console.log("🧪 sample drug names:", sample);

    // 🔥 Actual fuzzy query
    const drugs = await Rule.findAll({
      attributes: ["drug_name"],
      where: {
        active: true,
        [Op.and]: [
          where(
            fn("LOWER", col("drug_name")),
            {
              [Op.like]: `%${q}%`,
            }
          ),
        ],
      },
      group: ["drug_name"],
      order: [["drug_name", "ASC"]],
      limit: 20,
      raw: true,
      logging: (sql) => {
        console.log("🧾 GENERATED SQL:");
        console.log(sql);
      },
    });

    console.log("✅ matched rows count:", drugs.length);
    console.log("✅ matched drugs:", drugs);

    res.json(drugs);
  } catch (err) {
    console.error("❌ Drug search failed");
    console.error(err);
    res.status(500).json({ error: "Drug search failed" });
  }
});





/**
 * GET /drugs/:drug/symptoms?lang=en|ml
 */
router.get("/:drug/symptoms", async (req, res) => {
  const drug = req.params.drug;
  const lang = req.query.lang === "ml" ? "ml" : "en";

  try {
    const rows = await Rule.findAll({
      attributes: lang === "ml" ? ["symptom_ml"] : ["symptom"],
      where: {
        active: true,
        drug_name: drug, // canonical English
      },
      raw: true,
    });

    const key = lang === "ml" ? "symptom_ml" : "symptom";

    const symptoms = [
      ...new Set(
        rows
          .map(r => r[key])
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
