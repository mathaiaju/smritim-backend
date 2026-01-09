START TRANSACTION;

use adr_chatbot;

set SQL_SAFE_UPDATES= 0;

SET FOREIGN_KEY_CHECKS = 0;

-- =========================
-- ALERTS & PVPI
-- =========================
DELETE FROM pvpi_review_logs
WHERE case_id IN (
  SELECT id FROM pvpi_cases WHERE hospital_id = 2
);

DELETE FROM pvpi_cases WHERE hospital_id = 2;

DELETE FROM alerts WHERE hospital_id = 2;

-- =========================
-- DAILY LOGS
-- =========================
DELETE FROM daily_logs WHERE hospital_id = 2;

-- =========================
-- MEDICATIONS
-- =========================
DELETE ms
FROM medication_schedules ms
JOIN medications m ON m.id = ms.medication_id
WHERE m.hospital_id = 2;

DELETE FROM medications WHERE hospital_id = 2;

-- =========================
-- CONSENT
-- =========================
DELETE FROM consent
WHERE user_id IN (
  SELECT id FROM users WHERE hospital_id = 2
);

-- =========================
-- LINKS
-- =========================
DELETE pcl
FROM patient_clinician_link pcl
JOIN users u ON u.id = pcl.user_id
WHERE u.hospital_id = 2;

DELETE ucl
FROM user_caregiver_link ucl
JOIN users u ON u.id = ucl.user_id
WHERE u.hospital_id = 2;

-- =========================
-- USERS (PATIENTS)
-- =========================
DELETE FROM users WHERE hospital_id = 2;

-- =========================
-- CLINICIANS
-- =========================
DELETE FROM clinician_users WHERE hospital_id = 2;

-- =========================
-- CAREGIVERS
-- =========================
DELETE FROM caregivers WHERE hospital_id = 2;

-- =========================
-- AUTH USERS
-- =========================
DELETE FROM auth_users WHERE hospital_id = 2;

-- =========================
-- HOSPITAL
-- =========================
DELETE FROM hospitals WHERE id = 2;

SET FOREIGN_KEY_CHECKS = 1;

COMMIT;
