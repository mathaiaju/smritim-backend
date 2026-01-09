module.exports = (err, req, res, next) => {
  console.error(
    JSON.stringify({
      type: "ERROR",
      request_id: req.request_id,
      message: err.message,
      stack: err.stack
    })
  );

  res.status(500).json({ error: "server error" });
};
