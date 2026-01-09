const notifications = require("./notifications");

async function dispatchAlert(user_id, alert) {
  switch (alert.severity) {
    case "critical":
      await notifications.notifyClinicianIfConsented(user_id, alert);
      await notifications.notifyCaregiver(user_id, alert);
      await notifications.notifyEmergencyBanner(user_id, alert);
      break;

    case "high":
      await notifications.notifyClinicianIfConsented(user_id, alert);
      break;

    case "moderate":
    case "low":
      // No escalation; education only
      break;

    default:
      break;
  }
}

module.exports = { dispatchAlert };
