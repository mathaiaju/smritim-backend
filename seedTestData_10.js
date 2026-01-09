/**
 * MediRaksha – HOSPITAL 2 SEED SCRIPT (FINAL, VERIFIED)
 */

const mysql = require("mysql2/promise");

const dbConfig = {
  host: "localhost",
  user: "aju",
  password: "admin123",
  database: "adr_chatbot",
  multipleStatements: true
};

const HOSPITAL_ID = 2;
const PASSWORD_HASH = "$2b$10$HASHED"; // same hash you already use

(async () => {
  const conn = await mysql.createConnection(dbConfig);
  console.log("✅ Connected to MySQL");

  /* ================= HOSPITAL ================= */
 /* await conn.query(`
    INSERT INTO hospitals (id, name, code)
    VALUES (${HOSPITAL_ID}, 'Amrita Institute of Medical Sciences', 'AIMS_KOCHI');
  `);*/

  /* ================= ADMIN ================= */
  await conn.query(`
    INSERT INTO auth_users
      (hospital_id, username, password_hash, role, linked_id)
    VALUES
      (${HOSPITAL_ID}, 'admin_hosp2', '${PASSWORD_HASH}', 'hospital_admin', 0);
  `);

  console.log("✅ Admin created");

  /* ================= PATIENTS ================= */
  const patients = [
    "Amit Nair",
    "Suresh Menon",
    "Rajeev Pillai",
    "Anitha Varma",
    "Meera Krishnan",
    "Vijay Kumar",
    "Sunitha Reddy",
    "Arjun Iyer",
    "Lakshmi Mohan",
    "Prakash Das"
  ];

  for (let i = 0; i < patients.length; i++) {
    const phone = `90020000${i + 1}`;

    const [res] = await conn.query(`
      INSERT INTO users
        (hospital_id, phone, full_name, locale, emergency_contact)
      VALUES
        (${HOSPITAL_ID}, '${phone}', '${patients[i]}', 'en', '91120000${i + 1}');
    `);

    await conn.query(`
      INSERT INTO auth_users
        (hospital_id, username, password_hash, role, linked_id)
      VALUES
        (${HOSPITAL_ID}, 'patient2_${i + 1}', '${PASSWORD_HASH}', 'patient', ${res.insertId});
    `);
  }

  console.log("✅ Patients created");

  /* ================= CLINICIANS ================= */
  const clinicians = [
    "Dr. Ramesh Iyer",
    "Dr. Priya Nandakumar",
    "Dr. Joseph Mathew",
    "Dr. Kavitha Rao",
    "Dr. Sanjay Verma",
    "Dr. Neha Kapoor",
    "Dr. Arun Thomas",
    "Dr. Pooja Malhotra",
    "Dr. Rahul Sengupta",
    "Dr. Anil Chatterjee"
  ];

  for (let i = 0; i < clinicians.length; i++) {
    const phone = `91020000${i + 1}`;

    const [res] = await conn.query(`
      INSERT INTO clinician_users
        (hospital_id, full_name, email, phone, role)
      VALUES
        (${HOSPITAL_ID}, '${clinicians[i]}', 'doctor2_${i + 1}@aims.com', '${phone}', 'doctor');
    `);

    await conn.query(`
      INSERT INTO auth_users
        (hospital_id, username, password_hash, role, linked_id)
      VALUES
        (${HOSPITAL_ID}, 'clinician2_${i + 1}', '${PASSWORD_HASH}', 'clinician', ${res.insertId});
    `);
  }

  console.log("✅ Clinicians created");

  /* ================= CAREGIVERS ================= */
  const caregivers = [
    "Ravi Nair",
    "Anu Menon",
    "Suman Varma",
    "Deepak Iyer",
    "Rekha Sharma",
    "Manoj Pillai",
    "Geetha Krishnan",
    "Sandeep Gupta",
    "Divya Ramesh",
    "Kiran Joshi"
  ];

  for (let i = 0; i < caregivers.length; i++) {
    const phone = `92020000${i + 1}`;

    const [res] = await conn.query(`
      INSERT INTO caregivers
        (hospital_id, full_name, phone, relation)
      VALUES
        (${HOSPITAL_ID}, '${caregivers[i]}', '${phone}', 'family');
    `);

    await conn.query(`
      INSERT INTO auth_users
        (hospital_id, username, password_hash, role, linked_id)
      VALUES
        (${HOSPITAL_ID}, 'caregiver2_${i + 1}', '${PASSWORD_HASH}', 'caregiver', ${res.insertId});
    `);
  }

  console.log("✅ Caregivers created");

  /* ================= LINKS ================= */
  for (let i = 1; i <= 10; i++) {
    await conn.query(`
      INSERT INTO patient_clinician_link
        (user_id, clinician_id, relationship)
      VALUES (${i}, ${i}, 'primary');
    `);

    await conn.query(`
      INSERT INTO user_caregiver_link
        (user_id, caregiver_id, notify_missed, notify_redflag)
      VALUES (${i}, ${i}, TRUE, TRUE);
    `);
  }

  console.log("✅ Patient links created");

  console.log("🎉 HOSPITAL 2 SEEDING COMPLETE");
  await conn.end();
  process.exit(0);
})();
