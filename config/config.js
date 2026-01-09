require('dotenv').config();

module.exports = {
  db: {
    host: process.env.DB_HOST || 'localhost',   // ✅ service name
    username: process.env.DB_USER || 'aju',
    password: process.env.DB_PASSWORD || 'admin123', // ✅ FIXED
    database: process.env.DB_NAME || 'adr_chatbot',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  },
  server: {
    port: process.env.PORT || 3000
  }
};
