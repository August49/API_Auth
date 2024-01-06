const prisma = require("../startup/db");
const { hashpass } = require("../util/auth");
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
  sendEmailVerification(user);

  res
    .json({ message: "User created successfully", username: user.username })
    .status(200);
};

module.exports = {
  createNewUser: createNewUser,
};
