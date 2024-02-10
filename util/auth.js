const bcrypt = require("bcrypt");

const hashpass = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

const comparePass = async (password, hashedPassword) => {
  const validPassword = await bcrypt.compare(password, hashedPassword);
  return validPassword;
};

const authn = (req, res, next) => {
  console.log(req.session.user);
  if (!req.session.user) {
    return res
      .status(401)
      .json({ message: "Authentication failed: No session" });
  }

  try {
    req.user = req.session.user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed: Invalid session" });
  }
};

module.exports = {
  hashpass,
  comparePass,
  authn,
};
