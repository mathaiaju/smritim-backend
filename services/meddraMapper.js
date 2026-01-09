const db = require('../models');

async function mapToMeddra(termText) {
  const exact = await db.MeddraTerm.findOne({ where: { term: termText } });
  if (exact) return exact;
  const like = await db.MeddraTerm.findOne({ where: { term: { [db.Sequelize.Op.like]: '%' + termText + '%' } } });
  return like || null;
}

module.exports = { mapToMeddra };