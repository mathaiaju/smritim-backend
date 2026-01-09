const db = require("../models");

module.exports.log = async ({
  req,
  action,
  entity,
  entity_id,
  payload
}) => {
  try {
    await db.AuditLog.create({
      hospital_id: req.user?.hospital_id,
      user_id: req.user?.linked_id,
      role: req.user?.role,
      action,
      entity,
      entity_id,
      request_id: req.request_id,
      payload
    });
  } catch (err) {
    console.error("AUDIT LOG FAILED", err);
  }
};

