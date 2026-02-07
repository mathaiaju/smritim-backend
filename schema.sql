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
