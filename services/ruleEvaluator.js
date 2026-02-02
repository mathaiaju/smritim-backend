const db = require("../models");

/* =========================
   Helpers
========================= */
function normalize(text) {
  if (!text) return "";

  return text
    .toLowerCase()
    .replace(/[+/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(symptomStr) {
  if (!symptomStr) return [];

  // Handles: " +/ ", "+ /", "/", "+"
  return symptomStr
    .split(/\s*\+\/\s*|\s*\+\s*|\s*\/\s*/)
    .map(s => normalize(s))
    .filter(Boolean);
}

/* Severity-based thresholds */
const SEVERITY_MATCH_THRESHOLD = {
  critical: 2,
  high: 2,
  moderate: 3,
  low: 1
};

/* =====================================================
   Evaluate safety rules for a daily log
===================================================== */

async function evaluateForLog({
  user_id,
  medication_id,
  medication_schedule_id,
  quick_se = [],
  date,
  language
}) {
  console.log("Rule Evaluation Started");
  console.log("Quick SE:", quick_se);

  if (!Array.isArray(quick_se) || quick_se.length === 0) {
    return { alert: false };
  }

  /* =========================
     Normalize patient symptoms
  ========================= */
  const patientSymptoms = quick_se
    .map(s => (typeof s === "string" ? s.replace(/^\//, "").trim() : ""))
    .map(normalize)
    .filter(Boolean);

  console.log("Normalized patient symptoms:", patientSymptoms);

  /* =========================
     Load medication
  ========================= */
  const medication = await db.Medication.findByPk(medication_id);
  if (!medication) return { alert: false };

  const medName = normalize(medication.drug_name_generic);

  /* =========================
     Load relevant rules only
  ========================= */
  const rules = await db.Rule.findAll({
    where: {
      active: true,
      [db.Sequelize.Op.or]: [
        { drug_name: medication.drug_name_generic },
        { drug_name: "General" }
      ]
    },
    order: [
      [
        db.Sequelize.literal(
          "FIELD(severity,'critical','high','moderate','low')"
        ),
        "ASC"
      ]
    ]
  });

  /* =========================
     Evaluate rules
  ========================= */
  for (const rule of rules) {
    console.log("Language:", language);
    console
    const primaryField =
      language === "ml" ? rule.symptom_ml : rule.symptom;

    const fallbackField =
      language === "ml" ? rule.symptom : null;

    const ruleTokensPrimary = tokenize(primaryField);
    const ruleTokensFallback = fallbackField
      ? tokenize(fallbackField)
      : [];

    console.log("Rule:", rule.rule_name);
    console.log("Rule tokens:", ruleTokensPrimary);

    let matched = ruleTokensPrimary.filter(rt =>
      patientSymptoms.some(ps => ps.includes(rt))
    );

    // Malayalam → English fallback
    if (
      matched.length === 0 &&
      language === "ml" &&
      ruleTokensFallback.length > 0
    ) {
      matched = ruleTokensFallback.filter(rt =>
        patientSymptoms.some(ps => ps.includes(rt))
      );
    }

    if (matched.length === 0) {
      continue;
    }

    const totalRuleSymptoms =
      ruleTokensPrimary.length || ruleTokensFallback.length;

    const threshold =
      totalRuleSymptoms === 1
        ? 1
        : SEVERITY_MATCH_THRESHOLD[rule.severity] ?? 1;

    if (matched.length < threshold) {
      continue;
    }

    /* =========================
       RULE MATCH FOUND
    ========================= */
    console.log("✅ RULE MATCHED:", rule.rule_name);
    console.log("Matched symptoms:", matched);

    return {
      alert: true,
      rule: {
        id: rule.id,
        rule_name: rule.rule_name,
        severity: rule.severity,
        drug_name: rule.drug_name,
        symptom:
          language === "ml"
            ? rule.symptom_ml || rule.symptom
            : rule.symptom,
        action_card:
          language === "ml"
            ? rule.action_card_ml || rule.action_card
            : rule.action_card
      },
      matched_symptoms: matched,
      match_count: matched.length,
      required_count: threshold
    };
  }

  return { alert: false };
}

module.exports = { evaluateForLog };
