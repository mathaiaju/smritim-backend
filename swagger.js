const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MediRaksha API",
      version: "1.0.0",
      description:
        "Medication adherence, ADR detection, clinician monitoring & PvPI reporting API"
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local server"
      }
    ]
  },
  apis: ["./routes/*.js"] // 👈 auto-read route docs
};

module.exports = swaggerJSDoc(options);

