/**
 * MediRaksha – Realistic Unique Seed Data Script (No Repeated Names Across Hospitals)
 * ------------------------------------------------------------------------------------
 * - Drops and recreates all tables
 * - Loads rulebook.sql safely
 * - Unique realistic Indian names across all 3 hospitals (no duplicates)
 * - 3 hospitals, each with:
 *   • 1 hospital admin
 *   • 10 unique doctors
 *   • 10 unique patients
 *   • 10 unique caregivers
 * - Patient-doctor primary links (round-robin)
 * - Some patient-caregiver links
 * - Consent records
 * - auth_users: username = firstname.lastname (lowercase), password = "password" for all
 * - No data in alerts, daily_logs, pvpi_cases, etc.
 *
 * Run: node seedRealUniqueData.js
 */

const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs"); // npm install bcryptjs

const dbConfig = {
  host: "smritm-mysql",
  user: "aju",
  password: "admin123",
  database: "adr_chatbot",
  multipleStatements: true
};

const hospitals = [
  { id: 1, name: "Jubilee Mission Medical College and Research Institute", code: "JUBILEE_THRISSUR" },
  { id: 2, name: "Amrita Institute of Medical Sciences", code: "AMRITA_KOCHI" },
  { id: 3, name: "Government Medical College Thiruvananthapuram", code: "GMC_TVM" }
];

const doctors = {
  1: ['Divya Sharma', 'Priya Acharya', 'Ajay Thomas', 'Pooja Prasad', 'Vijay Desai', 'Sunil Sharma', 'Deepak Mathew', 'Radha Patel', 'Sachin Iyer', 'Rahul Gupta'],
  2: ['Asha George', 'Rajesh Desai', 'Arjun Sharma', 'Manoj Menon', 'Anjali Singh', 'Deepa Iyer', 'Sarita Mehta', 'Prakash Rao', 'Kavya Gupta', 'Tara Kumar'],
  3: ['Mahesh Thomas', 'Sneha Menon', 'Ravi Gupta', 'Radha Acharya', 'Suresh Reddy', 'Sneha Varghese', 'Nisha Kumar', 'Sunil Thomas', 'Sunil Nair', 'Sarita Rao']
};

const patients = {
  1: ['Manoj Mathew', 'Anil Reddy', 'Sunil Chopra', 'Suresh Singh', 'Manoj Thomas', 'Asha Krishnan', 'Deepa Varghese', 'Anjali Varghese', 'Deepa Patel', 'Manoj Singh'],
  2: ['Sachin Sharma', 'Mahesh Nair', 'Anil Kumar', 'Manoj Prasad', 'Divya Prasad', 'Sunita Jacob', 'Radha Singh', 'Rani Gupta', 'Shweta Menon', 'Asha Acharya'],
  3: ['Lakshmi Singh', 'Deepa Nair', 'Vijay Nair', 'Tara Sharma', 'Suresh Mohanty', 'Lakshmi Gupta', 'Geetha Babu', 'Rajesh Krishnan', 'Deepak Thomas', 'Anil Desai']
};

const caregivers = {
  1: ['Vijay Krishnan', 'Deepak Reddy', 'Sarita Menon', 'Neha Varghese', 'Sunita Sharma', 'Neha Desai', 'Vikram Krishnan', 'Karthik Iyer', 'Anil Thomas', 'Prakash Jacob'],
  2: ['Neha Acharya', 'Kavya Iyer', 'Arjun Verma', 'Lakshmi Reddy', 'Deepa Jacob', 'Nisha Vivek', 'Nisha Sharma', 'Shweta Singh', 'Ajay Menon', 'Vikram Mathew'],
  3: ['Kavya Singh', 'Rani Iyer', 'Naveen Iyer', 'Deepa George', 'Meera Singh', 'Geetha Binu', 'Mahesh Babu', 'Radha Kumar', 'Rohan Nair', 'Vijay Mehta']
};

function randomDateOfBirth(minAge = 18, maxAge = 75) {
  const today = new Date();

  const minYear = today.getFullYear() - maxAge;
  const maxYear = today.getFullYear() - minAge;

  const year = Math.floor(Math.random() * (maxYear - minYear + 1)) + minYear;
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1; // safe for all months

  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function randomWeightKg(min = 45, max = 95) {
  const weight = Math.random() * (max - min) + min;
  return Number(weight.toFixed(1));
}



(async () => {
  const conn = await mysql.createConnection(dbConfig);
  console.log("✅ Connected to MySQL");

  /* =====================================================
     DROP TABLES
  ===================================================== */
  console.log("🟥 Dropping tables...");
  await conn.query("SET FOREIGN_KEY_CHECKS = 0");

  const tables = [
    "user_caregiver_link", "caregivers", "consent", "patient_clinician_link",
    "clinician_users", "pvpi_review_logs", "weekly_rollup", "pvpi_cases",
    "alerts", "daily_logs", "medication_schedules", "medications",
    "meddra_terms", "users", "rules", "auth_users", "hospitals", "audit_logs","sleep_logs","mood_logs"
  ];

  for (const t of tables) {
    await conn.query(`DROP TABLE IF EXISTS ${t}`);
  }

  await conn.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log("✅ Tables dropped");

  /* =====================================================
     CREATE TABLES (same as original schema)
  ===================================================== */
  console.log("🟩 Creating tables...");
  await conn.query(`
    -- (Paste the exact CREATE TABLE statements from the previous script here)
    -- For brevity, assuming same as before. Copy from earlier version.
    CREATE TABLE hospitals (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(150) NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      contact_email VARCHAR(100),
      contact_phone VARCHAR(20),
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE users (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      hospital_id BIGINT NOT NULL,
      phone VARCHAR(20) UNIQUE NOT NULL,
      full_name VARCHAR(100),
      locale ENUM('ml','en') DEFAULT 'ml',
      emergency_contact VARCHAR(20),
      date_of_birth DATE NULL,
      weight_kg DECIMAL(5,2) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    CREATE TABLE auth_users (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      hospital_id BIGINT NOT NULL,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('hospital_admin','clinician','caregiver','patient') NOT NULL,
      linked_id BIGINT NOT NULL,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE clinician_users (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      hospital_id BIGINT NOT NULL,
      full_name VARCHAR(100),
      email VARCHAR(100),
      phone VARCHAR(20),
      role ENUM('doctor','pharmacologist','nurse'),
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    CREATE TABLE patient_clinician_link (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT,
      clinician_id BIGINT,
      relationship ENUM('primary','secondary'),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (clinician_id) REFERENCES clinician_users(id)
    );

    CREATE TABLE caregivers (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      hospital_id BIGINT NOT NULL,
      full_name VARCHAR(100),
      phone VARCHAR(20),
      relation VARCHAR(50),
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    CREATE TABLE user_caregiver_link (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT,
      caregiver_id BIGINT,
      notify_missed BOOLEAN,
      notify_redflag BOOLEAN,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (caregiver_id) REFERENCES caregivers(id)
    );

    CREATE TABLE consent (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT,
      version VARCHAR(20),
      share_with_clinician BOOLEAN,
      share_with_caregiver BOOLEAN,
      share_with_pvpi BOOLEAN,
      consent_text TEXT,
      consented_at TIMESTAMP,
      revoked_at TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE medications (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      hospital_id BIGINT NOT NULL,
      user_id BIGINT NOT NULL,
      drug_name_generic VARCHAR(100),
      drug_name_brand VARCHAR(100),
      indication VARCHAR(255),
      start_date DATE,
      stop_date DATE,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    CREATE TABLE medication_schedules (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      medication_id BIGINT NOT NULL,
      dose VARCHAR(50),
      time_of_day ENUM('morning','afternoon','evening','night'),
      scheduled_time TIME,
      before_food BOOLEAN DEFAULT FALSE,
      after_food BOOLEAN DEFAULT TRUE,
      active BOOLEAN DEFAULT TRUE,
      FOREIGN KEY (medication_id) REFERENCES medications(id)
    );

    CREATE TABLE daily_logs (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      hospital_id BIGINT NOT NULL,
      user_id BIGINT,
      medication_id BIGINT,
      medication_schedule_id BIGINT,
      log_date DATE,
      status ENUM('taken','late','skipped','missed'),
      minutes_late INT DEFAULT 0,
      reason ENUM('forgot','side_effect','ran_out','cost','other','no_response'),
      quick_se JSON,
      mood_score TINYINT,
      sleep_hours DECIMAL(3,1),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (medication_id) REFERENCES medications(id),
      FOREIGN KEY (medication_schedule_id) REFERENCES medication_schedules(id)
    );

    /* Temporary VARCHAR for severity */
    CREATE TABLE rules (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,

      rule_name VARCHAR(150) NOT NULL,
      drug_name VARCHAR(100) NOT NULL,
      symptom VARCHAR(255) NOT NULL,
      symptom_ml VARCHAR(255) NOT NULL,
      severity VARCHAR(20) NOT NULL,
      action_card TEXT NOT NULL,
      action_card_ml TEXT NOT NULL,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );



    CREATE TABLE alerts (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      hospital_id BIGINT NOT NULL,
      user_id BIGINT,
      medication_id BIGINT,
      medication_schedule_id BIGINT,
      rule_id BIGINT,
      severity ENUM('low','moderate','high','critical'),
      alert_type ENUM('safety','adherence'),
      description TEXT,
      resolved BOOLEAN DEFAULT FALSE,
      resolved_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (medication_id) REFERENCES medications(id),
      FOREIGN KEY (medication_schedule_id) REFERENCES medication_schedules(id),
      FOREIGN KEY (rule_id) REFERENCES rules(id)
    );

    CREATE TABLE pvpi_cases (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      hospital_id BIGINT NOT NULL,
      user_id BIGINT NOT NULL,
      medication_id BIGINT NOT NULL,
      medication_schedule_id BIGINT NULL,
      log_date DATE NOT NULL,
      original_term VARCHAR(255) NOT NULL,
      meddra_term_id BIGINT NULL,
      seriousness ENUM('mild','moderate','serious') NOT NULL,
      outcome ENUM('unknown','recovered','ongoing','fatal') DEFAULT 'unknown',
      verified_by BIGINT NULL,
      submitted_to_pvpi BOOLEAN DEFAULT FALSE,
      submitted_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      adr_description TEXT,
      suspected_drug VARCHAR(255),
      reaction_outcome VARCHAR(255),
      reporter_name VARCHAR(100),
      reporter_contact VARCHAR(50),
      hospital_name VARCHAR(150),
      action_taken TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (medication_id) REFERENCES medications(id),
      FOREIGN KEY (medication_schedule_id) REFERENCES medication_schedules(id)
    );

    CREATE TABLE pvpi_review_logs (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      case_id BIGINT,
      reviewer_id BIGINT,
      action ENUM('pending','verified','rejected'),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE audit_logs (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      hospital_id BIGINT,
      user_id BIGINT,
      role VARCHAR(50),
      action VARCHAR(100),
      entity VARCHAR(50),
      entity_id BIGINT,
      request_id VARCHAR(50),
      payload JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE weekly_rollup (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT,
      week_start DATE,
      doses_taken INT,
      doses_missed INT,
      symptoms_reported INT,
      adherence_pct INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

      CREATE TABLE sleep_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        hospital_id BIGINT NOT NULL,
        user_id BIGINT NOT NULL,
        log_date DATE NOT NULL,

        /* =========================
          SUBJECTIVE RATING (1–5)
        ========================= */
        sleep_quality_rating TINYINT NOT NULL COMMENT '1=Very poor ... 5=Very good',

        /* =========================
          QUESTIONNAIRE SCORES (1–4 each)
        ========================= */
        q1_sleep_onset TINYINT NOT NULL,
        q2_maintenance TINYINT NOT NULL,
        q3_duration TINYINT NOT NULL,
        q4_restfulness TINYINT NOT NULL,
        q5_daytime_impact TINYINT NOT NULL,

        total_score TINYINT NOT NULL COMMENT '5–20',
        interpretation VARCHAR(30) NOT NULL COMMENT 'excellent | good | poor | very_poor',
        notes TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_sleep_user_date (user_id, log_date),
        INDEX idx_sleep_user (user_id),
        INDEX idx_sleep_date (log_date)
    );

    CREATE TABLE mood_logs (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      hospital_id BIGINT NOT NULL,
      user_id BIGINT NOT NULL,
      log_date DATE NOT NULL,

      /* =========================
        CORE QUESTIONS (1–5)
      ========================= */
      mood_level TINYINT NOT NULL COMMENT '1=Very low ... 5=Very high',
      energy_level TINYINT NOT NULL COMMENT '1=Very low ... 5=Very high',
      sleep_change TINYINT NOT NULL COMMENT '1=More than usual ... 4=Much less',
      thought_speed TINYINT NOT NULL COMMENT '1=Slow ... 4=Racing',
      impulsivity TINYINT NOT NULL COMMENT '1=None ... 4=A lot',
      daily_functioning TINYINT NOT NULL COMMENT '1=Very poor ... 5=Very well',

      /* =========================
        AUTO ADD-ONS (nullable)
      ========================= */
      hopelessness TINYINT NULL COMMENT '0–3',
      slowed_down TINYINT NULL COMMENT '0–3',
      overconfidence TINYINT NULL COMMENT '0–3',
      risk_taking TINYINT NULL COMMENT '0–3',

      /* =========================
        SAFETY
      ========================= */
      self_harm_ideation TINYINT NULL COMMENT '0=None,1=Brief,2=Strong,3=Declined',

      /* =========================
        DERIVED STATE (ENGINE)
      ========================= */
      trend_state ENUM(
        'stable',
        'depressive_trend',
        'manic_trend',
        'mixed',
        'unknown'
      ) DEFAULT 'unknown',

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      UNIQUE KEY uq_mood_user_date (user_id, log_date),
      INDEX idx_mood_user (user_id),
      INDEX idx_mood_date (log_date),
      INDEX idx_mood_trend (trend_state)
    );

    ALTER TABLE adr_chatbot.mood_logs
    MODIFY impulsivity INT NULL DEFAULT NULL,
    MODIFY overconfidence INT NULL DEFAULT NULL,
    MODIFY risk_taking INT NULL DEFAULT NULL,
    MODIFY hopelessness INT NULL DEFAULT NULL,
    MODIFY slowed_down INT NULL DEFAULT NULL;

    ALTER TABLE alerts
    MODIFY alert_type VARCHAR(50) NOT NULL;


  `);
  console.log("✅ Tables created");

  /* =====================================================
     INSERT HOSPITALS
  ===================================================== */
  for (const h of hospitals) {
    await conn.query(`INSERT INTO hospitals (id, name, code) VALUES (?, ?, ?)`, [h.id, h.name, h.code]);
  }

  const passwordHash = await bcrypt.hash("password", 10);

  for (const hospital of hospitals) {
    const hospitalId = hospital.id;
    const hospitalCodeLower = hospital.code.toLowerCase();

    // Hospital Admin
    await conn.query(
      `INSERT INTO auth_users (hospital_id, username, password_hash, role, linked_id) VALUES (?, ?, ?, 'hospital_admin', ?)`,
      [hospitalId, `admin.${hospitalCodeLower}`, passwordHash, hospitalId]
    );

    // Doctors
    const clinicianIds = [];
    const doctorList = doctors[hospitalId];
    for (let i = 0; i < 10; i++) {
      const name = doctorList[i];
      const [first, last] = name.split(' ');
      const username = `${first.toLowerCase()}.${last.toLowerCase()}`;

      const [res] = await conn.query(
        `INSERT INTO clinician_users (hospital_id, full_name, email, phone, role) VALUES (?, ?, ?, ?, 'doctor')`,
        [hospitalId, name, `${username}@${hospitalCodeLower}.com`, `99999${String(hospitalId * 100 + i + 1).padStart(5, '0')}`]
      );
      const clinicianId = res.insertId;
      clinicianIds.push(clinicianId);

      await conn.query(
        `INSERT INTO auth_users (hospital_id, username, password_hash, role, linked_id) VALUES (?, ?, ?, 'clinician', ?)`,
        [hospitalId, username, passwordHash, clinicianId]
      );
    }

    // Patients
    const patientUserIds = [];
    const patientList = patients[hospitalId];
    for (let i = 0; i < 10; i++) {
      const name = patientList[i];
      const [first, last] = name.split(' ');
      const username = `${first.toLowerCase()}.${last.toLowerCase()}`;
      const phone = `9447${String(hospitalId).padStart(2,'0')}${String(i + 1).padStart(4,'0')}`;

      const dob = randomDateOfBirth(18, 75);
      const weightKg = randomWeightKg(45, 95);

      const [res] = await conn.query(
        `INSERT INTO users (
          hospital_id,
          phone,
          full_name,
          locale,
          emergency_contact,
          date_of_birth,
          weight_kg
        )
        VALUES (?, ?, ?, 'en', ?, ?, ?)`,
        [
          hospitalId,
          phone,
          name,
          `9999${String(hospitalId * 100 + i + 1).padStart(5,'0')}`,
          dob,
          weightKg
        ]
      );

      const userId = res.insertId;
      patientUserIds.push(userId);

      await conn.query(
        `INSERT INTO auth_users (hospital_id, username, password_hash, role, linked_id) VALUES (?, ?, ?, 'patient', ?)`,
        [hospitalId, username, passwordHash, userId]
      );

      // Primary doctor link
      const clinicianId = clinicianIds[i];
      await conn.query(
        `INSERT INTO patient_clinician_link (user_id, clinician_id, relationship) VALUES (?, ?, 'primary')`,
        [userId, clinicianId]
      );

      // Consent (vary share_with_caregiver)
      const shareCaregiver = (i % 3 !== 0);
      await conn.query(
        `INSERT INTO consent (user_id, version, share_with_clinician, share_with_caregiver, share_with_pvpi, consent_text, consented_at)
         VALUES (?, 'v1.0', TRUE, ?, TRUE, 'Consent given', NOW())`,
        [userId, shareCaregiver]
      );
    }

    // Caregivers
    const caregiverList = caregivers[hospitalId];
    for (let i = 0; i < 10; i++) {
      const name = caregiverList[i];
      const [first, last] = name.split(' ');
      const username = `${first.toLowerCase()}.${last.toLowerCase()}`;
      const phone = `8111${String(hospitalId).padStart(2,'0')}${String(i + 1).padStart(4,'0')}`;

      const [res] = await conn.query(
        `INSERT INTO caregivers (hospital_id, full_name, phone, relation) VALUES (?, ?, ?, 'Family Member')`,
        [hospitalId, name, phone]
      );
      const caregiverId = res.insertId;

      await conn.query(
        `INSERT INTO auth_users (hospital_id, username, password_hash, role, linked_id) VALUES (?, ?, ?, 'caregiver', ?)`,
        [hospitalId, username, passwordHash, caregiverId]
      );

      // Link to some patients (first 7 caregivers get one patient each)
      if (i < 7) {
        const patientIndex = i;
        const userId = patientUserIds[patientIndex];
        await conn.query(
          `INSERT INTO user_caregiver_link (user_id, caregiver_id, notify_missed, notify_redflag) VALUES (?, ?, TRUE, TRUE)`,
          [userId, caregiverId]
        );
      }
    }
  }

  /* =====================================================
     LOAD RULEBOOK
  ===================================================== */
  console.log("📘 Loading clinical rulebook...");
  let rulesSQL = fs.readFileSync(path.join(__dirname, "rulebook.sql"), "utf8");

  rulesSQL = rulesSQL
    .replace(/'medium'/gi, "'moderate'")
    .replace(/severity\s*=\s*medium/gi, "severity = 'moderate'");

  await conn.query(rulesSQL);

  await conn.query(`UPDATE rules SET severity = LOWER(TRIM(severity))`);
  await conn.query(`UPDATE rules SET severity = 'moderate' WHERE severity NOT IN ('low','moderate','high','critical')`);
  await conn.query(`ALTER TABLE rules MODIFY severity ENUM('low','moderate','high','critical') NOT NULL`);

  console.log("✅ Rulebook loaded and locked");

  console.log("🎉 SEEDING COMPLETED – Unique realistic data inserted across all hospitals");
  await conn.end();
})().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});