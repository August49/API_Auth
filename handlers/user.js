const prisma = require("../startup/db");
const { hashpass, generateAuthToken } = require("../util/auth");
const { sendEmailVerification } = require("../util/mail");
const { validateUser } = require("../validators/user");

const createNewUser = async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { username, email, password } = req.body;
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).send("User with this email already exists");
  }

  const hashedPassword = await hashpass(password);

  const user = await prisma.user.create({
    data: {
      username: username,
      email: email,
      password: hashedPassword,
    },
  });
  const token = generateAuthToken(user);
  sendEmailVerification(user);

  res.status(201).json({ message: "User created successfully", token: token });
};

const verifyEmail = async (req, res) => {
  const { token } = req.params;

  const user = await prisma.user.findUnique({
    where: {
      emailVerificationToken: token,
    },
  });

  if (!user) return res.status(400).json({ message: "invalid token" });

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
    },
  });

  res.json({ message: "email verified" }).status(200);
};

module.exports = {
  createNewUser: createNewUser,
  verifyEmail: verifyEmail,
};
