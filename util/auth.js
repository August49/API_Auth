const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

const hashpasss = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

const comparePass = async (password, hashedPassword) => {
  const validPassword = await bcrypt.compare(password, hashedPassword);
  return validPassword;
};

const generateAuthToken = async (user) => {
  const token = await jwt.sign({ id: user.id, email: user.email }, secret, {
    expiresIn: "2h",
  });
  return token;
};

const authn = (req, res, next) => {
  const token = req.header("Authorization").replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication failed: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed: Invalid token" });
  }
};

module.exports = {
  hashpass: hashpasss,
  comparePass: comparePass,
  generateAuthToken: generateAuthToken,
  authn: authn,
};
