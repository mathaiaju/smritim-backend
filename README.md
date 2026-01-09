# MediRaksha Backend (Demo)

This is a demo Node.js + Express + Sequelize backend for the MediRaksha Malayalam ADR chatbot project.

## Quickstart (local)

1. Install dependencies
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and edit DB credentials.
3. Create MySQL database `mediraksha`.
4. Seed sample data:
   ```bash
   npm run seed
   ```
5. Run the app:
   ```bash
   npm run dev
   ```

API endpoints (examples):
- `POST /api/users` - create user
- `POST /api/medications` - add medication
- `POST /api/daily-logs` - create daily log (triggers rule eval)
- `GET /api/alerts` - list alerts
- `GET /api/clinicians/patient/:userId/weekly-summary` - weekly summary
- `GET /api/clinicians/patient/:userId/export-pdf` - export PDF one-pager

This is a demo scaffold. Replace notification stubs with real integrations before production.