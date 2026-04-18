const locks = new Map();

function requestLock(req, res, next) {
  const userId = req.user.userId;

  if (locks.get(userId)) {
    return res.status(429).json({
      error: "Previous request still processing"
    });
  }

  locks.set(userId, true);

  // Safety timeout (important)
  const timeout = setTimeout(() => {
    locks.delete(userId);
  }, 30000);

  res.on("finish", () => {
    clearTimeout(timeout);
    locks.delete(userId);
  });

  next();
}

module.exports = requestLock;