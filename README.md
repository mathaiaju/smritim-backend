# 🏥 Smritim Backend

Smritim Backend is a Node.js + Express backend powering the Smritim healthcare platform.  
It supports medication adherence tracking, adverse drug reaction (ADR) monitoring, PvPI case workflows, clinician dashboards, and a patient-facing chatbot with strong safety and audit controls.

---

## ✨ Features

- Patient medication adherence tracking
- Rule-based ADR detection
- Patient chatbot (English + Malayalam)
- Clinician & Admin alert management
- PvPI case creation and submission
- Daily symptom logging
- Role-based access control
- Comprehensive audit logging
- Healthcare-compliant design

---

## 🧱 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL
- **ORM:** Sequelize
- **Authentication:** JWT
- **Language:** JavaScript (ES6)

---

## 📁 Project Structure

```text
smritim-backend/
├── models/
│   ├── User.js
│   ├── Medication.js
│   ├── MedicationSchedule.js
│   ├── Alert.js
│   ├── Rule.js
│   ├── PvpiCase.js
│   ├── DailyLog.js
│   ├── AuditLog.js
│   └── index.js
│
├── routes/
│   ├── auth.js
│   ├── alerts.js
│   ├── dailyLogs.js
│   ├── drugs.js
│   ├── pvpi.js
│   └── patientChatbot.js
│
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
│
├── services/
│   ├── ruleEngine.js
│   └── auditLogger.js
│
├── config/
│   └── database.js
│
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
