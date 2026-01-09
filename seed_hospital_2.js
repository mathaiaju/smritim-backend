// seed_hospital_2.js

const bcrypt = require("bcryptjs");

const {
  sequelize,
  AuthUser,
  User,
  ClinicianUser,
  Caregiver,
  Hospital,
} = require("./models");

const HOSPITAL_ID = 2;

async function seed() {
  let transaction;
  try {
    console.log("🌱 Starting seed for hospital_id = 2");

    await sequelize.authenticate();
    console.log("✅ Connected to database");

    transaction = await sequelize.transaction();

    const passwordHash = await bcrypt.hash("password", 10);

    /* =========================
       HOSPITAL (REQUIRED FIRST)
    ========================= */
    await Hospital.create(
      {
        id: HOSPITAL_ID,
        code: "Amrita Hosiptal",
        name: "AMRITA_KOCHI",
        // Add more required fields here if needed in the future
      },
      { transaction }
    );
    console.log("✅ Hospital created with id = 2 and code = HOSP002");

    /* =========================
       HOSPITAL ADMIN
    ========================= */
    await AuthUser.create(
      {
        hospital_id: HOSPITAL_ID,
        username: "admin_hosp2",
        password_hash: "$2b$10$HASHED",
        role: "hospital_admin",
        linked_id: 0, // hospital_admin has no linked record in other tables
      },
      { transaction }
    );
    console.log("✅ Admin user created: admin_hosp2");

    /* =========================
       PATIENTS
    ========================= */
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
      "Prakash Das",
    ];

    for (let i = 0; i < patients.length; i++) {
      // 1. Create the patient record in `users` table
      const user = await User.create(
        {
          hospital_id: HOSPITAL_ID,
          full_name: patients[i],
          phone: `900000000${i + 10}`,
          locale: "en",
          emergency_contact: `900000001${i + 10}`,
        },
        { transaction }
      );

      // 2. Create the corresponding auth entry with correct linked_id (user.id)
      await AuthUser.create(
        {
          hospital_id: HOSPITAL_ID,
          username: `patient2_${i + 1}`,
          password_hash: "$2b$10$HASHED",
          role: "patient",
          linked_id: user.id, // ← This is the ID from the `users` table (patient record)
        },
        { transaction }
      );
    }
    console.log(`✅ ${patients.length} Patients + AuthUsers created`);

    /* =========================
       CLINICIANS
    ========================= */
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
      "Dr. Anil Chatterjee",
    ];

    for (let i = 0; i < clinicians.length; i++) {
      // 1. Create the clinician record in `clinician_users` table
      const clinician = await ClinicianUser.create(
        {
          hospital_id: HOSPITAL_ID,
          full_name: clinicians[i],
          email: `doctor${i + 1}@hospital2.com`,
          phone: `910000000${i + 10}`,
          role: "doctor",
        },
        { transaction }
      );

      // 2. Create the corresponding auth entry with correct linked_id (clinician.id)
      await AuthUser.create(
        {
          hospital_id: HOSPITAL_ID,
          username: `clinician2_${i + 1}`,
          password_hash: "$2b$10$HASHED",
          role: "clinician",
          linked_id: clinician.id, // ← This is the ID from the `clinician_users` table
        },
        { transaction }
      );
    }
    console.log(`✅ ${clinicians.length} Clinicians + AuthUsers created`);

    /* =========================
       CAREGIVERS
    ========================= */
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
      "Kiran Joshi",
    ];

    for (let i = 0; i < caregivers.length; i++) {
      // 1. Create the caregiver record in `caregivers` table
      const caregiver = await Caregiver.create(
        {
          hospital_id: HOSPITAL_ID,
          full_name: caregivers[i],
          phone: `920000000${i + 10}`,
          relation: "Family",
        },
        { transaction }
      );

      // 2. Create the corresponding auth entry with correct linked_id (caregiver.id)
      await AuthUser.create(
        {
          hospital_id: HOSPITAL_ID,
          username: `caregiver2_${i + 1}`,
          password_hash: "$2b$10$HASHED",
          role: "caregiver",
          linked_id: caregiver.id, // ← This is the ID from the `caregivers` table
        },
        { transaction }
      );
    }
    console.log(`✅ ${caregivers.length} Caregivers + AuthUsers created`);

    await transaction.commit();
    console.log("🎉 Seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    if (transaction) {
      try {
        console.info(err);
        await transaction.rollback();
        console.log("🔄 Transaction rolled back");
      } catch (rollbackErr) {
        console.error("❌ Rollback failed:", rollbackErr);
      }
    }
    console.error("❌ Seed failed:", err.message || err);
    process.exit(1);
  }
}

seed();