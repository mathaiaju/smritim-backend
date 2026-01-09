/**
 * MediRaksha – FINAL WORKING SEED SCRIPT
 * ------------------------------------
 * ✔ Handles 800+ clinical rules safely
 * ✔ Avoids MySQL ENUM truncation
 * ✔ Converts severity to ENUM AFTER load
 *
 * Run: node seedTestData.js
 */

const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

/* =====================================================
   DB CONFIG
===================================================== */
const dbConfig = {
  host: "localhost",
  user: "aju",
  password: "admin123",
  database: "adr_chatbot",
  multipleStatements: true
};

/* =====================================================
   MAIN
===================================================== */
(async () => {
  const conn = await mysql.createConnection(dbConfig);
  console.log("✅ Connected to MySQL");

  /* =====================================================
     DROP TABLES
  ===================================================== */
  console.log("🟥 Dropping tables...");
  await conn.query("SET FOREIGN_KEY_CHECKS = 0");

  const tables = [
    "user_caregiver_link",
    "caregivers",
    "consent",
    "patient_clinician_link",
    "clinician_users",
    "pvpi_review_logs",
    "weekly_rollup",
    "pvpi_cases",
    "alerts",
    "daily_logs",
    "medication_schedules",
    "medications",
    "meddra_terms",
    "users",
    "rules",
    "auth_users",
    "hospitals"
  ];

  for (const t of tables) {
    await conn.query(`DROP TABLE IF EXISTS ${t}`);
  }

  await conn.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log("✅ Tables dropped");

  /* =====================================================
     CREATE TABLES
  ===================================================== */
  console.log("🟩 Creating tables...");

  await conn.query(`

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
      status ENUM('taken','late','skipped'),
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

    /* 🔑 RULES TABLE — SEVERITY AS VARCHAR (TEMPORARY) */
    CREATE TABLE rules (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      rule_name VARCHAR(150),
      drug_name VARCHAR(100),
      symptom VARCHAR(255),
      severity VARCHAR(20),
      action_card TEXT,
      active BOOLEAN DEFAULT TRUE
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

   CREATE TABLE pvpi_cases (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    hospital_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    medication_id BIGINT NOT NULL,
    medication_schedule_id BIGINT NULL,
    log_date DATE NOT NULL,
    original_term VARCHAR(255) NOT NULL,
     -- 🔑 FIX: add MedDRA mapping column
    meddra_term_id BIGINT NULL,
    seriousness ENUM('mild','moderate','serious') NOT NULL,
    outcome ENUM('unknown','recovered','ongoing','fatal') DEFAULT 'unknown',
    verified_by BIGINT NULL,
    submitted_to_pvpi BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
  `);

  console.log("✅ Tables created");

  await conn.query(`
    INSERT INTO hospitals (id, name, code)
    VALUES
    (1,'Jubilee Mission Medical College and Research Institute','JUBILEE_THRISSUR'),
    (2,'Amrita Hospital Kochi','AMRITA_KOCHI'),
    (3,'Govt Medical College TVM','GMC_TVM');
  `);

  await conn.query(`
    INSERT INTO auth_users (username, password_hash, role, linked_id, hospital_id)
    VALUES
('admin1', '$2b$10$HASHED', 'hospital_admin', 1, 1),
('dr.anjali', '$2b$10$HASHED', 'clinician', 1, 1),
('aju.patient', '$2b$10$HASHED', 'patient', 1, 1),
('mary.caregiver', '$2b$10$HASHED', 'caregiver', 1, 1);
`     );


  /* =====================================================
     LOAD RULEBOOK (SAFE MODE)
  ===================================================== */
  console.log("📘 Loading clinical rulebook...");

  let rulesSQL = fs.readFileSync(
    path.join(__dirname, "rulebook.sql"),
    "utf8"
  );

  // Normalize before insert
  rulesSQL = rulesSQL
    .replace(/'medium'/gi, "'moderate'")
    .replace(/severity\s*=\s*medium/gi, "severity = 'moderate'");

  await conn.query(rulesSQL);

  // Normalize + lock severity
  await conn.query(`
    UPDATE rules SET severity = LOWER(TRIM(severity))
  `);

  await conn.query(`
    UPDATE rules
    SET severity = 'moderate'
    WHERE severity NOT IN ('low','moderate','high','critical')
  `);

  await conn.query(`
    ALTER TABLE rules
    MODIFY severity ENUM('low','moderate','high','critical') NOT NULL
  `);

  console.log("✅ Rulebook loaded and locked");

  /* =====================================================
     INSERT CORE TEST DATA
  ===================================================== */
  console.log("🟦 Inserting seed data...");

  await conn.query(`
    INSERT INTO users VALUES
    (1,1,'9999000001','Aju Mathew','ml','9999111111',NOW(),NOW()),
    (2,1,'9999000002','Diya Joseph','ml','9999222222',NOW(),NOW());
  `);

  await conn.query(`
  INSERT INTO clinician_users
    (id, hospital_id, full_name, email, phone, role)
  VALUES
    (1, 1, 'Dr. Anjali Menon', 'anjali@example.com', '9999666666', 'doctor'),
    (2, 1, 'Dr. Rajeev Kumar', 'rajeev@example.com', '9999777777', 'pharmacologist');
`);


    await conn.query(`
    INSERT INTO patient_clinician_link (id, user_id, clinician_id, relationship) VALUES
    (1, 1, 1, 'primary'),
    (2, 2, 2, 'primary');
  `);

    await conn.query(`
    INSERT INTO consent
      (id, user_id, version, share_with_clinician, share_with_caregiver, share_with_pvpi, consent_text, consented_at)
    VALUES
      (1, 1, 'v1', TRUE, TRUE, TRUE, 'Malayalam consent text', NOW()),
      (2, 2, 'v1', TRUE, FALSE, TRUE, 'Malayalam consent text', NOW());
  `);



  await conn.query(`
    INSERT INTO medications VALUES
    (1,1,1,'Lithium Carbonate','Lithosun','Bipolar Disorder','2025-09-01',NULL),
    (2,1,1,'Olanzapine','Olanex','Bipolar Disorder','2025-09-01',NULL),
    (3,1,2,'Clozapine','Clozatal','Schizophrenia','2025-09-01',NULL);
      `);

  await conn.query(`
    INSERT INTO medication_schedules VALUES
    (1,1,'300 mg','morning','08:00:00',FALSE,TRUE,TRUE),
    (2,2,'5 mg','night','21:00:00',FALSE,TRUE,TRUE),
    (3,3,'25 mg','night','21:00:00',FALSE,TRUE,TRUE);
  `);

  await conn.query(`
    INSERT INTO daily_logs VALUES
    (1,1,1,1,1,'2025-10-15','taken',0,NULL,'[]',2,7.5,NOW(),NOW()),
    (2,1,1,1,1,'2025-10-14','late',30,'forgot','["tremor"]',1,6.5,NOW(),NOW()),
    (3,1,2,3,3,'2025-10-15','skipped',0,'side_effect','["fever"]',1,5.5,NOW(),NOW());
  `);

    /* =====================================================
     INSERT ALERT SEED DATA
  ===================================================== */
  console.log("🚨 Inserting alerts...");

  // Pick some existing rule IDs safely
  const [rules] = await conn.query(`
    SELECT id, severity FROM rules
    ORDER BY FIELD(severity,'critical','high','moderate','low')
    LIMIT 5
  `);

  if (rules.length < 3) {
    throw new Error("Not enough rules to seed alerts");
  }

  const [
    criticalRule,
    highRule,
    moderateRule,
    lowRule
  ] = rules;

  await conn.query(
    `
    INSERT INTO alerts
      (user_id, hospital_id,medication_id, medication_schedule_id, rule_id, severity, alert_type, description, resolved, resolved_at, created_at)
    VALUES
      (?, ?, ?, ?, ?, 'critical', 'safety',
       'High fever reported while on Clozapine. Immediate medical attention required.',
       FALSE, NULL, NOW()),

      (?, ?, ?, ?, ?, 'high', 'safety',
       'Tremor detected while on Lithium. Contact doctor urgently.',
       FALSE, NULL, NOW()),

      (?, ?, ?, ?, ?, 'moderate', 'safety',
       'Weight gain reported. Monitor diet and exercise.',
       FALSE, NULL, NOW()),

      (?, ?, ?, ?, ?, 'low', 'safety',
       'Mild sedation reported. Take medication at bedtime.',
       TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY))
    `,
    [
      // 🔴 critical
      2, 1, 3, 3, criticalRule.id,

      // 🔴 high
      1, 1, 1, 1, highRule.id,

      // 🟠 moderate
      1, 1, 2, 2, moderateRule.id,

      // 🟢 low (resolved)
      1, 1, 2, 2, lowRule.id
    ]
  );

  console.log("✅ Alerts seeded");



await conn.query(`
  INSERT INTO pvpi_cases (
    id,
    hospital_id,
    user_id,
    medication_id,
    medication_schedule_id,
    log_date,
    original_term,
    meddra_term_id,
    seriousness,
    outcome,
    verified_by,
    submitted_to_pvpi
  ) VALUES
  (
    1,
    1,
    1,
    1,
    1,
    '2025-10-14',
    'hand tremor',
    1,
    'serious',
    'ongoing',
    1,
    FALSE
  ),
  (
    2,
    1,
    2,
    3,
    3,
    '2025-10-15',
    'high fever',
    2,
    'serious',
    'ongoing',
    2,
    FALSE
  );
`);

await conn.query(`
  INSERT INTO pvpi_review_logs (
    id,
    case_id,
    reviewer_id,
    action,
    notes
  ) VALUES
  (
    1,
    1,
    1,
    'verified',
    'Consistent with Lithium-induced tremor'
  ),
  (
    2,
    2,
    2,
    'pending',
    'Awaiting CBC report'
  );
`);




  console.log("🎉 DONE – DATABASE READY");
  await conn.end();
})();
