require('dotenv').config();
module.exports = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    username: process.env.DB_USER || 'changeit',
    password: process.env.DB_PASS || 'changeit',
    database: process.env.DB_NAME || 'adr_chatbot',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql'
  },
  server: { port: process.env.PORT || 3000 }
};
