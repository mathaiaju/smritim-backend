const { Sequelize } = require("sequelize");
const cfg = require("../config/config").db;

const sequelize = new Sequelize(cfg.database, cfg.username, cfg.password, {
  host: cfg.host,
  port: cfg.port,
  dialect: cfg.dialect,
  logging: false
});

const db = { sequelize, Sequelize };

/* =========================
   MODEL REGISTRATION
========================= */

db.Hospital = require("./hospital")(sequelize);

db.User = require("./user")(sequelize);
db.AuthUser = require("./auth_user")(sequelize, Sequelize.DataTypes);

db.ClinicianUser = require("./clinician_user")(sequelize);
db.Caregiver = require("./caregiver")(sequelize);

db.Medication = require("./medication")(sequelize);
db.MedicationSchedule = require("./medication_schedule")(sequelize);

db.DailyLog = require("./daily_log")(sequelize);
db.Alert = require("./alert")(sequelize);
db.Rule = require("./rule")(sequelize);


db.PatientClinicianLink = require("./patient_clinician_link")(sequelize);

db.PatientCaregiverLink = require("./user_caregiver_link")(
  sequelize,
  Sequelize.DataTypes
);



db.Consent = require("./consent")(sequelize);

db.PvpiCase = require("./pvpi_case")(sequelize);
db.PvpiReviewLog = require("./pvpi_review_log")(sequelize);
db.MeddraTerm = require("./meddra_term")(sequelize);

db.AuditLog = require('./AuditLog')(sequelize, Sequelize);

db.SleepLog = require("./sleepLog")(sequelize, Sequelize);
db.MoodLog  = require("./moodLog")(sequelize, Sequelize);



/* =========================
   HOSPITAL (TENANT) LINKS
========================= */

// Hospital → Users
db.Hospital.hasMany(db.User, { foreignKey: "hospital_id" });
db.User.belongsTo(db.Hospital, { foreignKey: "hospital_id" });

// Hospital → Clinicians
db.Hospital.hasMany(db.ClinicianUser, { foreignKey: "hospital_id" });
db.ClinicianUser.belongsTo(db.Hospital, { foreignKey: "hospital_id" });

// Hospital → Caregivers
db.Hospital.hasMany(db.Caregiver, { foreignKey: "hospital_id" });
db.Caregiver.belongsTo(db.Hospital, { foreignKey: "hospital_id" });

// Hospital → Auth users
db.Hospital.hasMany(db.AuthUser, { foreignKey: "hospital_id" });
db.AuthUser.belongsTo(db.Hospital, { foreignKey: "hospital_id" });

/* =========================
   CORE MEDICATION FLOW
========================= */

// User → Medication
db.User.hasMany(db.Medication, { foreignKey: "user_id" });
db.Medication.belongsTo(db.User, { foreignKey: "user_id" });

// Medication → Schedules
db.Medication.hasMany(db.MedicationSchedule, {
  foreignKey: "medication_id"
});
db.MedicationSchedule.belongsTo(db.Medication, {
  foreignKey: "medication_id"
});

// User → Daily Logs
db.User.hasMany(db.DailyLog, { foreignKey: "user_id" });
db.DailyLog.belongsTo(db.User, { foreignKey: "user_id" });

// Schedule → Daily Logs
db.MedicationSchedule.hasMany(db.DailyLog, {
  foreignKey: "medication_schedule_id"
});
db.DailyLog.belongsTo(db.MedicationSchedule, {
  foreignKey: "medication_schedule_id"
});

// Medication → Daily Logs (legacy)
db.Medication.hasMany(db.DailyLog, {
  foreignKey: "medication_id"
});
db.DailyLog.belongsTo(db.Medication, {
  foreignKey: "medication_id"
});

/* =========================
   ALERTS
========================= */

db.User.hasMany(db.Alert, { foreignKey: "user_id" });
db.Alert.belongsTo(db.User, { foreignKey: "user_id" });

db.Medication.hasMany(db.Alert, { foreignKey: "medication_id" });
db.MedicationSchedule.hasMany(db.Alert, {
  foreignKey: "medication_schedule_id"
});

db.Alert.belongsTo(db.Medication, { foreignKey: "medication_id" });
db.Alert.belongsTo(db.MedicationSchedule, {
  foreignKey: "medication_schedule_id"
});

/* ✅ ADD THIS */
db.Rule.hasMany(db.Alert, { foreignKey: "rule_id" });
db.Alert.belongsTo(db.Rule, { foreignKey: "rule_id" });

/* =========================
   PATIENT ↔ CLINICIAN
========================= */

db.User.belongsToMany(db.ClinicianUser, {
  through: db.PatientClinicianLink,
  foreignKey: "user_id",
  otherKey: "clinician_id"
});

db.PatientClinicianLink.belongsTo(db.User, {
  foreignKey: "user_id"
});
db.PatientClinicianLink.belongsTo(db.ClinicianUser, {
  foreignKey: "clinician_id"
});

/* =========================
   PATIENT ↔ CAREGIVER
========================= */

db.PatientCaregiverLink.belongsTo(db.User, {
  foreignKey: "user_id"
});
db.PatientCaregiverLink.belongsTo(db.Caregiver, {
  foreignKey: "caregiver_id"
});

/*db.User.belongsToMany(db.Caregiver, {
  through: db.UserCaregiverLink,
  foreignKey: "user_id",
  otherKey: "caregiver_id"
});*/

/* =========================
   CONSENT
========================= */

db.User.hasOne(db.Consent, { foreignKey: "user_id" });
db.Consent.belongsTo(db.User, { foreignKey: "user_id" });

/* =========================
   PVPI / ADR FLOW
========================= */

db.User.hasMany(db.PvpiCase, { foreignKey: "user_id" });
db.PvpiCase.belongsTo(db.User, { foreignKey: "user_id" });

db.Medication.hasMany(db.PvpiCase, { foreignKey: "medication_id" });
db.MedicationSchedule.hasMany(db.PvpiCase, {
  foreignKey: "medication_schedule_id"
});

db.PvpiCase.belongsTo(db.Medication, {
  foreignKey: "medication_id"
});
db.PvpiCase.belongsTo(db.MedicationSchedule, {
  foreignKey: "medication_schedule_id"
});

// MedDRA mapping
db.MeddraTerm.hasMany(db.PvpiCase, {
  foreignKey: "meddra_term_id"
});
db.PvpiCase.belongsTo(db.MeddraTerm, {
  foreignKey: "meddra_term_id"
});

// PvPI review logs
db.PvpiCase.hasMany(db.PvpiReviewLog, {
  foreignKey: "case_id"
});
db.PvpiReviewLog.belongsTo(db.PvpiCase, {
  foreignKey: "case_id"
});

module.exports = db;
