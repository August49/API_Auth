const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

const hashpass = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

const comparePass = async (password, hashedPassword) => {
  const validPassword = await bcrypt.compare(password, hashedPassword);
  return validPassword;
};

const generateAuthToken = async (user, exp = "1h") => {
  const token = await jwt.sign({ id: user.id }, secret, {
    expiresIn: exp,
  });
  return token;
};

const authn = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({
      message: "Authentication failed: No Authorization header provided",
    });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication failed: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, secret);
    console.log(decoded);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed: Invalid token" });
  }
};

module.exports = {
  hashpass,
  comparePass,
  generateAuthToken,
  authn,
};
