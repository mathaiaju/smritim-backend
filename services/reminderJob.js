const cron = require('node-cron');
const { MedicationSchedule, Medication, User } = require('../models');
const { Op } = require('sequelize');

async function runReminderJob() {
  try {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:mm

    console.log('[REMINDER] Checking schedules at', currentTime);

    const schedules = await MedicationSchedule.findAll({
      where: {
        active: true,
        scheduled_time: {
          [Op.between]: [`${currentTime}:00`, `${currentTime}:59`]
        }
      },
      include: [
        {
          model: Medication,
          include: [User]
        }
      ]
    });

    for (const sch of schedules) {
      const user = sch.Medication.User;

      console.log(
        `[REMINDER] User ${user.id} (${user.phone}) → ${sch.Medication.drug_name_generic} ${sch.dose}`
      );

      // TODO: WhatsApp / SMS / push
    }
  } catch (err) {
    console.error('[REMINDER ERROR]', err);
  }
}

/**
 * Start cron (every minute)
 */
function startReminderCron() {
  console.log('⏰ Reminder cron started (every minute)');
  cron.schedule('* * * * *', runReminderJob);
}

module.exports = {
  runReminderJob,
  startReminderCron
};
