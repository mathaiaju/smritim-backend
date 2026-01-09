const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('MeddraTerm', {
  id:{ type: DataTypes.BIGINT, autoIncrement:true, primaryKey:true },
  llt_code: { type: DataTypes.STRING(20), unique: true },
  pt_code: { type: DataTypes.STRING(20) },
  term: DataTypes.STRING(255)
}, { tableName: 'meddra_terms', timestamps: false });