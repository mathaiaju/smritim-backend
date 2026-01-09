SET FOREIGN_KEY_CHECKS = 0;

use adr_chatbot;

-- 🔥 Child tables first
DROP TABLE IF EXISTS user_caregiver_link;
DROP TABLE IF EXISTS patient_clinician_link;

-- 🔥 Logging & derived data tables
DROP TABLE IF EXISTS weekly_rollups;
DROP TABLE IF EXISTS pvpi_review_logs;

-- 🔥 Core functional tables
DROP TABLE IF EXISTS daily_logs;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS pvpi_cases;

-- 🔥 Configuration / metadata tables
DROP TABLE IF EXISTS rules;
DROP TABLE IF EXISTS meddra_terms;

-- 🔥 Supporting entities
DROP TABLE IF EXISTS caregivers;
DROP TABLE IF EXISTS consent;
DROP TABLE IF EXISTS clinician_users;

-- 🔥 Medication table (depends on users)
DROP TABLE IF EXISTS medications;

-- 🔥 Root table
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

