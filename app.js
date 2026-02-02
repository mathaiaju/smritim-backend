const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const db = require('./models');
const config = require('./config/config');

const usersRouter = require('./routes/users');
const medsRouter = require('./routes/meds');
const dailyLogsRouter = require('./routes/dailyLogs');
const alertsRouter = require('./routes/alerts');
const cliniciansRouter = require('./routes/clinicians');
const pvpiRouter = require('./routes/pvpi');
const medicalRoutes= require('./routes/medicationSchedules');

const reminderJob = require('./services/reminderJob');
const caregiverRoutes = require("./routes/caregivers");


const cors = require("cors");

const app = express();

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});


/* ✅ CORS — MUST BE FIRST */
app.use(cors({
  origin: (origin, callback) => {
    // allow flutter web + postman + mobile
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

/* ✅ HANDLE PREFLIGHT */

app.use(require("./middleware/requestLogger"));

app.options("*", cors());

app.use(express.json());

app.use(bodyParser.json());

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const swaggerDocument = require('./swagger-output.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.use('/api/users', usersRouter);
app.use('/api/meds', medsRouter); 
app.use('/api/daily-logs', dailyLogsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/clinicians', cliniciansRouter);
app.use('/api/pvpi', pvpiRouter);
app.use("/api/medication-schedules", medicalRoutes);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/clinicians", require("./routes/clinicians"));
app.use("/api/users", require("./routes/users"));

app.use("/api/hospitals", require("./routes/hospitals"));
app.use("/api/caregivers", require("./routes/caregivers"));
app.use("/api/admin", require("./routes/admin"));

app.use("/api/patient/chatbot", require("./routes/patient_chatbot"));


app.use(require("./middleware/errorLogger"));

app.use('/api/drugs', require('./routes/drugs'));


app.use("/api/patient/chatbot", require("./routes/patient_chatbot_llm"));

app.use("/api/sleep-logs", require("./routes/sleep-logs"));
app.use("/api/mood-logs", require("./routes/mood-logs"));




app.get('/', (req,res)=> res.json({ok:true, msg:'MediRaksha backend'}));

(async () => {
  try {
    //await db.sequelize.sync({ force: false, alter: false });

    //console.log('DB synced');
    //reminderJob.startReminderCron(); // start cron jobs
    app.listen(config.server.port, () => {
      console.log(`Server running on port ${config.server.port}`);
    });
  } catch (err) {
    console.error('Failed to start', err);
    process.exit(1);
  }
})();