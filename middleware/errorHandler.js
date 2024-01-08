const logger = require("../startup/log");

module.exports = function (err, req, res, next) {
  console.log(err);
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    logger.error(err);
    return res.status(400).send({ message: "Bad request" });
  }
  logger.error(err.message, err);
  res.status(500).send("Something failed.");

  next();
};
