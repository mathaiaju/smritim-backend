const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'MediRaksha API',
    description: 'Auto-generated Swagger docs'
  },
  host: 'localhost:3000',
  schemes: ['http'],
  tags: [
    { name: 'Users' },
    { name: 'Medications' },
    { name: 'Daily Logs' },
    { name: 'Clinicians' },
    { name: 'PvPI' },
    { name: 'Alerts' }
  ]
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./app.js']; // 👈 scans all routes from app.js

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  require('./app'); // start server after generation
});
