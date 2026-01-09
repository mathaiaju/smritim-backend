const db = require('../models');

/* =========================
   EXISTING FUNCTIONS (UNCHANGED)
========================= */

async function notifyClinicianIfConsented(userId, alert) {
  const consent = await db.Consent.findOne({ where: { user_id: userId } });
  if (!consent || !consent.share_with_clinician) return;

  const link = await db.PatientClinicianLink.findOne({
    where: { user_id: userId }
  });
  if (!link) return;

  const clinician = await db.ClinicianUser.findByPk(link.clinician_id);
  if (!clinician) return;

  console.log(
    `[NOTIFY][CLINICIAN] ${clinician.email} | User ${userId} | ${alert.severity.toUpperCase()} | ${alert.description}`
  );
  // TODO: email / WhatsApp integration
}

async function notifyCaregiver(userId, alert) {
  const consent = await db.Consent.findOne({ where: { user_id: userId } });
  if (!consent || !consent.share_with_caregiver) return;

  const links = await db.UserCaregiverLink.findAll({
    where: { user_id: userId, notify_redflag: true }
  });

  for (const l of links) {
    const caregiver = await db.Caregiver.findByPk(l.caregiver_id);
    if (!caregiver) continue;

    console.log(
      `[NOTIFY][CAREGIVER] ${caregiver.phone} | User ${userId} | ${alert.severity.toUpperCase()} | ${alert.description}`
    );
  }
}

/* =========================
   NEW: EMERGENCY BANNER
========================= */

async function notifyEmergencyBanner(userId, alert) {
  console.log(
    `[EMERGENCY][PATIENT] User ${userId} | ${alert.description}`
  );

  // Future:
  // - WhatsApp red card
  // - IVR call
  // - SMS fallback
}

/* =========================
   NEW: PRIORITY DISPATCHER
========================= */

async function dispatchAlertBySeverity(userId, alert) {
  switch (alert.severity) {
    case 'critical':
      // Full escalation
      await notifyEmergencyBanner(userId, alert);
      await notifyClinicianIfConsented(userId, alert);
      await notifyCaregiver(userId, alert);
      break;

    case 'high':
      // Urgent clinician
      await notifyClinicianIfConsented(userId, alert);
      break;

    case 'moderate':
    case 'low':
      // Education only – no escalation
      break;

    default:
      break;
  }
}

module.exports = {
  notifyClinicianIfConsented,
  notifyCaregiver,
  notifyEmergencyBanner,
  dispatchAlertBySeverity
};
