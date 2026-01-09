# SMRITIM Backend API

Production-grade Node.js backend powering the **SMRITIM / MediRaksha** platform.

---

## 🧠 Overview

The SMRITIM Backend provides:
- Medication management
- Patient–clinician workflows
- ADR detection & rule evaluation
- PvPI case creation & submission
- AI-assisted patient chatbot
- Audit logging & compliance tracking

Built with **Node.js + Express + Sequelize (MySQL)**.

---

## 🏗️ Architecture

**Core layers**
- Routes (REST APIs)
- Services (business logic)
- Models (Sequelize ORM)
- Middleware (auth, audit, role-based access)
- Rules engine (ADR evaluation)
- Chatbot orchestration layer

---

## 🔑 Key Features

### 👩‍⚕️ Clinical Safety
- Rule-based ADR detection
- Severity classification (low → critical)
- Auto-alert generation

### 🧑‍🤝‍🧑 Roles
- Patient
- Clinician
- Hospital Admin

### 📋 PvPI Workflow
- Create PvPI case from alert
- Review & verify
- Submit to PvPI (admin)
- Full audit trail

### 🤖 Patient Chatbot
- Adherence logging
- Symptom selection (rule-backed)
- Malayalam + English support
- LLM fallback

---

## 🧱 Tech Stack

- Node.js 18+
- Express.js
- Sequelize ORM
- MySQL
- JWT Authentication
- OpenAI / LLM integration
- Role-based access control

---

## 📁 Project Structure

```
backend/
├── app.js
├── server.js
├── routes/
│   ├── auth.js
│   ├── alerts.js
│   ├── pvpi.js
│   ├── dailyLogs.js
│   ├── chatbot.js
│   └── drugs.js
├── models/
│   ├── User.js
│   ├── Medication.js
│   ├── Rule.js
│   ├── Alert.js
│   ├── PvpiCase.js
│   ├── AuditLog.js
│   └── index.js
├── services/
│   ├── ruleEngine.js
│   ├── chatbotService.js
│   └── auditLogger.js
├── middleware/
│   ├── auth.js
│   └── roleGuard.js
├── config/
│   └── database.js
├── .env.example
└── package.json
```

---

## ⚙️ Environment Variables

Create `.env` from `.env.example`

```env
NODE_ENV=development
PORT=4000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=smritim

JWT_SECRET=supersecret

OPENAI_API_KEY=sk-xxxx
```

> ⚠️ Never commit `.env` to GitHub.

---

## 🗄️ Database Setup

1. Create MySQL database
```sql
CREATE DATABASE smritim;
```

2. Run migrations / sync
```bash
npm run migrate
# or
npm run dev
```

---

## ▶️ Run Locally

```bash
npm install
npm run dev
```

Server runs on:
```
http://localhost:4000
```

---

## 🔐 Authentication

- JWT-based auth
- Role-based guards
- Hospital-level data isolation

Roles:
- `patient`
- `clinician`
- `hospital_admin`

---

## 📡 API Highlights

### Alerts
```
GET /api/alerts
```

### PvPI
```
POST /api/pvpi/from-alert
POST /api/pvpi/submit
```

### Chatbot
```
POST /api/patient/chatbot/adherence
POST /api/patient/chatbot/symptoms
```

### Drugs & Rules
```
GET /api/drugs/:name/symptoms
```

---

## 🧪 Rule Engine

- Drug-specific rules
- Multi-symptom matching
- Threshold-based triggering
- Severity escalation

---

## 📜 Audit Logging

All sensitive actions logged:
- User
- Role
- Entity
- Payload
- Timestamp

Supports compliance & traceability.

---

## 🚀 Deployment

Recommended:
- Docker + Nginx
- AWS / GCP / OCI
- Managed MySQL
- Secrets via cloud vault

---

## 🛡️ Security Notes

- JWT expiration enforced
- Role-based access checks
- Hospital-level data scoping
- SQL injection protection via ORM

---

## 📈 Roadmap

- PvPI auto-export
- FHIR integration
- Advanced analytics dashboard
- Voice chatbot support
- Offline sync

---

## 👨‍💻 Maintainer

**SMRITIM / MediRaksha Team**

For clinical safety, compliance, and patient-first care.

---

## 📄 License

Proprietary – Internal / Research Use
