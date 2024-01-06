const bcrypt = require("bcrypt");

const hashpasss = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

const comparePass = async (password, hashedPassword) => {
  const validPassword = await bcrypt.compare(password, hashedPassword);
  return validPassword;
};

module.exports = {
  hashpass: hashpasss,
  comparePass: comparePass,
};
