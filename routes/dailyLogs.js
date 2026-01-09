  const express = require('express');
  const router = express.Router();
  const db = require('../models');
  const ruleEvaluator = require('../services/ruleEvaluator');
  const notifications = require('../services/notifications');
  const auth = require('../middleware/auth');
  const audit = require("../services/auditLogger");



  /* =====================================================
    POST /api/dailyLogs
    Patient submits daily log (JWT user only)
  ===================================================== */
  router.post(
    '/',
    auth(['patient']),
    async (req, res) => {
      try {
        const {
          medication_schedule_id,
          medication_id, // legacy
          log_date,
          status,
          minutes_late = 0,
          reason,
          quick_se,
          mood_score,
          sleep_hours
        } = req.body;

        const user_id = req.user.linked_id;
        const hospital_id = req.user.hospital_id;
        

        if (!log_date || !status) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        let scheduleId = medication_schedule_id;
        let resolvedMedicationId = medication_id;

        /* =========================
          RESOLVE SCHEDULE
        ========================= */

        if (scheduleId) {
          const schedule = await db.MedicationSchedule.findByPk(scheduleId, {
            include: db.Medication
          });

          if (!schedule) {
            return res.status(404).json({ error: 'Medication schedule not found' });
          }

          if (
            schedule.Medication.user_id !== user_id ||
            schedule.Medication.hospital_id !== hospital_id
          ) {
            return res.status(403).json({ error: 'Unauthorized schedule access' });
          }

          resolvedMedicationId = schedule.medication_id;
        }

        // Legacy fallback
        if (!scheduleId && medication_id) {
          const schedule = await db.MedicationSchedule.findOne({
            where: { medication_id, active: true },
            include: [{
              model: db.Medication,
              where: { user_id, hospital_id }
            }],
            order: [['id', 'ASC']]
          });

          if (!schedule) {
            return res.status(400).json({
              error: 'No active schedule found for medication'
            });
          }

          scheduleId = schedule.id;
        }

        if (!scheduleId) {
          return res.status(400).json({
            error: 'medication_schedule_id or medication_id is required'
          });
        }

        /* =========================
          UPSERT DAILY LOG
        ========================= */

        const [log, created] = await db.DailyLog.findOrCreate({
          where: {
            user_id,
            medication_schedule_id: scheduleId,
            log_date
          },
          defaults: {
            hospital_id,
            user_id,
            medication_id: resolvedMedicationId,
            medication_schedule_id: scheduleId,
            log_date,
            status,
            minutes_late,
            reason,
            quick_se,
            mood_score,
            sleep_hours
          }
        });

        if (!created) {
          await log.update({
            status,
            minutes_late,
            reason,
            quick_se,
            mood_score,
            sleep_hours
          });
        }

       

        await audit.log({
          req,
          action: "CREATE_OR_UPDATE",
          entity: "DailyLog",
          entity_id: log.id,
          payload: {
            status,
            medication_schedule_id: scheduleId,
            quick_se
          }
        });


        /* =========================
          RULE EVALUATION
        ========================= */


        console.log("Rule Evaluation Started");
        console.log("User ID:", user_id);
        console.log("Medication ID:", resolvedMedicationId);
        console.log("Schedule ID:", scheduleId);
        console.log("Quick SE:", quick_se);
        console.log("Log Date:", log_date);
        console.log("Log Status:", status);



        const evaluation = await ruleEvaluator.evaluateForLog({
          user_id,
          medication_id: resolvedMedicationId,
          medication_schedule_id: scheduleId,
          quick_se,
          date: log_date
        });

         console.log("evaluation", evaluation);


         /* ===============================
          CREATE ALERT (FIXED + SAFE)
          ================================ */
         let createdAlert = null;

          if (evaluation.alert === true && evaluation.rule) {
            createdAlert = await db.Alert.create({
              hospital_id,
              user_id,
              medication_id: resolvedMedicationId,
              medication_schedule_id: scheduleId,
              rule_id: evaluation.rule.id,
              severity: evaluation.rule.severity,
              alert_type: 'safety',
              description: evaluation.rule.action_card
            });
          }

          if (createdAlert) {
            await notifications.dispatchAlertBySeverity(user_id, createdAlert);
          }

      

        /*if (evaluation.alert) {
          
          const alert = await db.Alert.create({
            hospital_id,
            user_id,
            medication_id: resolvedMedicationId,
            medication_schedule_id: scheduleId,
            rule_id: evaluation.rule.id,
            severity: evaluation.rule.severity,
            alert_type: 'safety',
            description: evaluation.rule.action_card
          });*/

       

        res.json({ log, evaluation });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
      }
    }
  );

  /* =====================================================
    GET /api/dailyLogs
  ===================================================== */
  router.get(
    '/',
    auth(['patient', 'clinician', 'hospital_admin']),
    async (req, res) => {
      try {
        const { user_id, log_date } = req.query;
        const where = { hospital_id: req.user.hospital_id };

        // PATIENT → only own logs
        if (req.user.role === 'patient') {
          where.user_id = req.user.linked_id;
        }

        // CLINICIAN → linked patients only
        if (req.user.role === 'clinician' && user_id) {
          const link = await db.PatientClinicianLink.findOne({
            where: {
              clinician_id: req.user.linked_id,
              user_id
            }
          });
          if (!link) {
            return res.status(403).json({ error: 'Not authorized' });
          }
          where.user_id = user_id;
        }

        // ADMIN → hospital only (optional user filter)
        if (req.user.role === 'hospital_admin' && user_id) {
          where.user_id = user_id;
        }

        if (log_date) where.log_date = log_date;

        const logs = await db.DailyLog.findAll({
          where,
          include: [db.Medication, db.MedicationSchedule],
          order: [['log_date', 'DESC']]
        });

        res.json(logs);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
      }
    }
  );

  module.exports = router;
