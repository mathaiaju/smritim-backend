const db = require("../models");

/**
 * Clinician → Get assigned patients
 */
exports.getPatients = async (req, res) => {
  try {
    const clinicianId = parseInt(req.params.id);

    // Clinician can only access own patients
    if (req.user.role === "clinician" && req.user.linked_id !== clinicianId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const links = await db.PatientClinicianLink.findAll({
      where: {
        clinician_id: clinicianId
      },
      include: [
        {
          model: db.User,
          attributes: ["id", "full_name", "phone"],
          where: { hospital_id: req.user.hospital_id }
        }
      ]
    });

    const patients = links.map(l => l.User);
    res.json(patients);
  } catch (err) {
    console.error("Get patients error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
