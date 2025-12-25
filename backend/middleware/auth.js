module.exports = (req, res, next) => {
  // TEMP: mock authenticated user
  req.user = { id: 1 };
  next();
};
