SET FOREIGN_KEY_CHECKS = 0;

USE adr_chatbot;

-- =====================================================
-- DROP TABLES (SAFE ORDER)
-- =====================================================

DROP TABLE IF EXISTS user_caregiver_link;
DROP TABLE IF EXISTS patient_clinician_link;

DROP TABLE IF EXISTS weekly_rollups;
DROP TABLE IF EXISTS pvpi_review_logs;

DROP TABLE IF EXISTS daily_logs;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS pvpi_cases;

DROP TABLE IF EXISTS medication_schedules;
DROP TABLE IF EXISTS medications;

DROP TABLE IF EXISTS rules;
DROP TABLE IF EXISTS meddra_terms;

DROP TABLE IF EXISTS caregivers;
DROP TABLE IF EXISTS consent;
DROP TABLE IF EXISTS clinician_users;

DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- CREATE TABLES
-- =====================================================

-- =====================
-- USERS (PATIENTS)
-- =====================
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(100),
  locale ENUM('ml','en') DEFAULT 'ml',
  emergency_contact VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================
-- CLINICIANS
-- =====================
CREATE TABLE clinician_users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  role ENUM('doctor','pharmacologist','nurse'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- PATIENT ↔ CLINICIAN
-- =====================
CREATE TABLE patient_clinician_link (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  clinician_id BIGINT NOT NULL,
  relationship ENUM('primary','secondary'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (clinician_id) REFERENCES clinician_users(id)
);

-- =====================
-- CONSENT
-- =====================
CREATE TABLE consent (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  version VARCHAR(20),
  share_with_clinician BOOLEAN DEFAULT FALSE,
  share_with_caregiver BOOLEAN DEFAULT FALSE,
  share_with_pvpi BOOLEAN DEFAULT FALSE,
  consent_text TEXT,
  consented_at TIMESTAMP NULL,
  revoked_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =====================
-- CAREGIVERS
-- =====================
CREATE TABLE caregivers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(100),
  phone VARCHAR(20),
  relation VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- USER ↔ CAREGIVER
-- =====================
CREATE TABLE user_caregiver_link (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  caregiver_id BIGINT NOT NULL,
  notify_missed BOOLEAN DEFAULT TRUE,
  notify_redflag BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (caregiver_id) REFERENCES caregivers(id)
);

-- =====================
-- MEDICATIONS (WHAT)
-- =====================
CREATE TABLE medications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  drug_name_generic VARCHAR(100),
  drug_name_brand VARCHAR(100),
  strength VARCHAR(50),              -- e.g. 300 mg per tablet
  route ENUM('oral','injection') DEFAULT 'oral',
  indication VARCHAR(255),
  start_date DATE,
  stop_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =====================
-- MEDICATION SCHEDULES (WHEN & HOW)
-- =====================
CREATE TABLE medication_schedules (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  medication_id BIGINT NOT NULL,
  time_of_day ENUM('morning','afternoon','evening','night'),
  scheduled_time TIME,
  quantity DECIMAL(3,1) DEFAULT 1,
  food_relation ENUM('before_food','after_food','with_food','anytime') DEFAULT 'anytime',
  frequency ENUM('daily','weekly','biweekly') DEFAULT 'daily',
  is_prn BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medication_id) REFERENCES medications(id)
);

-- =====================
-- DAILY LOGS
-- =====================
CREATE TABLE daily_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  medication_id BIGINT NULL,              -- legacy support
  medication_schedule_id BIGINT NULL,     -- preferred
  log_date DATE NOT NULL,
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

-- =====================
-- RULES (SAFETY ENGINE)
-- =====================
CREATE TABLE rules (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  rule_name VARCHAR(100),
  drug_name VARCHAR(100),
  symptom VARCHAR(100),
  severity ENUM('low','moderate','high'),
  action_card TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE rules
MODIFY severity ENUM('low','moderate','high','critical');

-- =====================
-- ALERTS
-- =====================
CREATE TABLE alerts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  medication_id BIGINT,
  medication_schedule_id BIGINT,
  rule_id BIGINT,
  severity ENUM('low','moderate','high'),
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

-- =====================
-- MEDDRA TERMS
-- =====================
CREATE TABLE meddra_terms (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  llt_code VARCHAR(20) UNIQUE,
  pt_code VARCHAR(20),
  term VARCHAR(255)
);

-- =====================
-- PVPI CASES
-- =====================
CREATE TABLE pvpi_cases (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  medication_id BIGINT,
  medication_schedule_id BIGINT,
  log_date DATE,
  original_term VARCHAR(255),
  meddra_term_id BIGINT,
  seriousness ENUM('mild','moderate','serious'),
  outcome ENUM('unknown','recovered','ongoing','fatal'),
  verified_by BIGINT,
  submitted_to_pvpi BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (medication_id) REFERENCES medications(id),
  FOREIGN KEY (medication_schedule_id) REFERENCES medication_schedules(id),
  FOREIGN KEY (meddra_term_id) REFERENCES meddra_terms(id)
);

-- =====================
-- PVPI REVIEW LOGS
-- =====================
CREATE TABLE pvpi_review_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  case_id BIGINT NOT NULL,
  reviewer_id BIGINT NOT NULL,
  action ENUM('pending','verified','rejected'),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES pvpi_cases(id),
  FOREIGN KEY (reviewer_id) REFERENCES clinician_users(id)
);

-- =====================
-- WEEKLY ROLLUPS
-- =====================
CREATE TABLE weekly_rollups (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  week_start DATE,
  doses_taken INT,
  doses_missed INT,
  symptoms_reported INT,
  adherence_pct INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
