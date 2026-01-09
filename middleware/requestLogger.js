const { v4: uuid } = require("uuid");

module.exports = (req, res, next) => {
  req.request_id = uuid();
  const start = Date.now();

  console.log(
    JSON.stringify({
      type: "REQUEST_START",
      request_id: req.request_id,
      method: req.method,
      path: req.originalUrl,
      user_id: req.user?.linked_id || null,
      role: req.user?.role || null,
      time: new Date().toISOString()
    })
  );

  res.on("finish", () => {
    console.log(
      JSON.stringify({
        type: "REQUEST_END",
        request_id: req.request_id,
        status: res.statusCode,
        duration_ms: Date.now() - start
      })
    );
  });

  next();
};
