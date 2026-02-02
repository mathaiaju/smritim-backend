const PDFDocument = require("pdfkit");


const {
  User,
  Medication,
  MedicationSchedule,
  DailyLog,
  Alert,
  PatientClinicianLink,
  ClinicianUser
} = require("../models");


async function generatePatientOnePager(userId) {
  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found");

  const primaryLink = await PatientClinicianLink.findOne({
  where: {
    user_id: userId,
    relationship: "primary"
  },
  include: [
    {
      model: ClinicianUser,
      attributes: ["full_name"]
    }
  ]
});

  const doctorName =
  primaryLink?.ClinicianUser?.full_name ?? "—";


  const medications = await Medication.findAll({
    where: { user_id: userId },
    include: [{ model: MedicationSchedule }]
  });

  const dailyLogs = await DailyLog.findAll({
    where: { user_id: userId },
    order: [["log_date", "DESC"]],
    limit: 14
  });

  const alerts = await Alert.findAll({
    where: { user_id: userId },
    order: [["created_at", "DESC"]],
    limit: 5
  });

  const fmt = (d) =>
    d ? new Date(d).toISOString().split("T")[0] : "—";

  // 🔑 IMPORTANT: wrap PDF generation in a Promise
  return new Promise((resolve, reject) => {
    try {


      const COLORS = {
  primary: "#1E3A8A",     // indigo-800
  secondary: "#475569",   // slate-600
  danger: "#B91C1C",      // red-700
  warning: "#B45309",     // amber-700
  success: "#166534",     // green-700
  light: "#F1F5F9"
};

function sectionTitle(doc, text) {
  doc
    .moveDown(1)
    .fontSize(14)
    .fillColor(COLORS.primary)
    .text(text, { underline: true })
    .moveDown(0.5)
    .fillColor("black");
}

function labelValue(doc, label, value) {
  doc
    .fontSize(11)
    .fillColor(COLORS.secondary)
    .text(`${label}: `, { continued: true })
    .fillColor("black")
    .text(value ?? "—");
}

function calculateAge(dob) {
  if (!dob) return "—";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const age = calculateAge(user.date_of_birth);

      const weight =
      user.weight_kg !== null && user.weight_kg !== undefined
        ? `${user.weight_kg} kg`
        : "—";


   
/* ================= HEADER ================= */
doc
  .fontSize(22)
  .fillColor(COLORS.primary)
  .text("Patient Medication Safety Report", {
    align: "center"
  });

  doc
  .moveDown(0.3)
  .fontSize(10)
  .fillColor(COLORS.secondary)
  .text("Confidential • For clinical use only", { align: "center" });

  doc.moveDown(1.5).fillColor("black");

   

/* ============ PATIENT META (2 COLUMN) ============ */
labelValue(doc, "Patient", user.full_name);
labelValue(doc, "Primary Doctor", doctorName);
labelValue(doc, "Age", `${age} years`);
labelValue(doc, "Weight", weight);
labelValue(doc, "Phone", user.phone);

labelValue(
  doc,
  "Language",
  user.locale === "ml" ? "Malayalam" : "English"
);
labelValue(doc, "Emergency Contact", user.emergency_contact);

doc.moveDown(1);

      /* ================= MEDICATIONS ================= */
sectionTitle(doc, "Active Medications");

if (!medications.length) {
  doc.fontSize(11).text("No active medications.");
} else {
  medications.forEach((m, idx) => {
    doc
      .fontSize(12)
      .fillColor("black")
      .text(`${idx + 1}. ${m.drug_name_generic}`, { continued: true })
      .fillColor(COLORS.secondary)
      .text(` (${m.drug_name_brand || "Generic"})`);

    if (!m.MedicationSchedules?.length) {
      doc
        .fontSize(10)
        .fillColor(COLORS.warning)
        .text("   No schedules configured");
    } else {
      m.MedicationSchedules.forEach((s) => {
        doc
          .fontSize(10)
          .fillColor("black")
          .text(
            `   • ${s.time_of_day} @ ${s.scheduled_time} | Dose: ${s.dose} | ${
              s.before_food ? "Before food" : "After food"
            }`
          );
      });
    }

    doc.moveDown(0.5);
  });
}


      /* ================= DAILY LOGS ================= */
sectionTitle(doc, "Recent Adherence (Last 14 Days)");

if (!dailyLogs.length) {
  doc.fontSize(11).text("No adherence logs available.");
} else {
  dailyLogs.forEach((l) => {
    const statusColor =
      l.status === "taken" ? COLORS.success : COLORS.danger;

    doc
      .fontSize(10)
      .fillColor(statusColor)
      .text(
        `${fmt(l.log_date)}  •  ${l.status.toUpperCase()}`,
        { continued: true }
      )
      .fillColor("black")
      .text(
        `  | SE: ${
          Array.isArray(l.quick_se) ? l.quick_se.join(", ") : "None"
        }  | Mood: ${l.mood_score ?? "—"}  | Sleep: ${
          l.sleep_hours ?? "—"
        } hrs`
      );
  });
}


      /* ================= ALERTS ================= */
sectionTitle(doc, "Recent Safety Alerts");

if (!alerts.length) {
  doc.fontSize(11).text("No alerts triggered.");
} else {
  alerts.forEach((a) => {
    const color =
      a.severity === "high"
        ? COLORS.danger
        : a.severity === "medium"
        ? COLORS.warning
        : COLORS.secondary;

    doc
      .fontSize(11)
      .fillColor(color)
      .text(
        `[${a.severity.toUpperCase()}] `,
        { continued: true }
      )
      .fillColor("black")
      .text(
        `${fmt(a.created_at)} – ${a.description} (Resolved: ${fmt(
          a.resolved_at
        )})`
      );
  });
}


      /* ================= FOOTER ================= */
doc.moveDown(2);

doc
  .fontSize(9)
  .fillColor(COLORS.secondary)
  .text(
    "This report summarizes medication adherence, side effects, and safety alerts.\nGenerated by SMRITI-M • Do not distribute without authorization.",
    { align: "center" }
  );


      doc.end(); // 🔥 triggers stream completion
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generatePatientOnePager };
