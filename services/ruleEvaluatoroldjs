const db = require("../models");


/* =========================
   Helpers
========================= */
function normalize(text) {
  return text.toLowerCase().trim();
}

function tokenizeRuleSymptoms(symptomStr) {
  return symptomStr
    .toLowerCase()
    .split("+/")
    .map(s => s.trim())
    .filter(Boolean);
}

/* Severity-based thresholds (for MULTI-symptom rules) */
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
  date
}) {
  if (!Array.isArray(quick_se) || quick_se.length === 0) {
    return { alert: false };
  }

  /* =========================
     Normalize patient symptoms
  ========================= */
  const patientSymptoms = quick_se.map(normalize);

  /* =========================
     Load medication
  ========================= */
  let medication = null;
  if (medication_id) {
    medication = await db.Medication.findByPk(medication_id);
    if (!medication) return { alert: false };
  }

  /* =========================
     Load rules (severity priority)
  ========================= */
  const rules = await db.Rule.findAll({
    where: { active: true },
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
    /* -------- Drug match -------- */
    const drugMatches =
      !rule.drug_name ||
      (medication &&
        normalize(rule.drug_name) ===
          normalize(medication.drug_name_generic));

    if (!drugMatches) continue;

    /* -------- Symptom matching -------- */
    const ruleSymptoms = tokenizeRuleSymptoms(rule.symptom);

    const matchedSymptoms = ruleSymptoms.filter(ruleToken =>
      patientSymptoms.some(ps => ps.includes(ruleToken))
    );

    if (matchedSymptoms.length === 0) continue;

    /* -------- Threshold logic -------- */
    let threshold;

    // 🔥 SINGLE-SYMPTOM RULE → always trigger on 1
    if (ruleSymptoms.length === 1) {
      threshold = 1;
    } else {
      threshold =
        SEVERITY_MATCH_THRESHOLD[rule.severity] ?? 1;
    }

    if (matchedSymptoms.length < threshold) continue;

    /* =========================
       RULE MATCH FOUND
    ========================= */
    console.log(
    JSON.stringify({
        type: "RULE_EVALUATION",
        user_id,
        medication_id,
        rule_id: rule?.id,
        severity: rule?.severity,
        triggered: !!rule,
        timestamp: new Date().toISOString()
      })
    );

 

    return {
      alert: true,
      rule: {
        id: rule.id,
        severity: rule.severity,
        action_card: rule.action_card,
        drug_name: rule.drug_name,
        symptom: rule.symptom
      },
      matched_symptoms: matchedSymptoms,
      match_count: matchedSymptoms.length,
      required_count: threshold
    };

 

  }

  return { alert: false };
}

module.exports = {
  evaluateForLog
};
