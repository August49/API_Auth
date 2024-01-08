const prisma = require("../startup/db");
const { hashpass, generateAuthToken, comparePass } = require("../util/auth");
const { sendEmailVerification, sendPasswordReset } = require("../util/mail");
const {
  validateUser,
  validateSignIn,
  validateEmail,
} = require("../validators/user");
/*============================   SIGN UP ROUTES   ============================*/
const createNewUser = async (req, res) => {
  const { error, value } = validateUser(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { username, email, password } = value;
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
  const token = await generateAuthToken(user, "1h");
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

const resendEmailVerification = async (req, res) => {
  const { error, value } = validateEmail(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const { email } = value;
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (!user) return res.status(400).json({ message: "user not found" });

  sendEmailVerification(user);

  res.json({ message: "email sent" }).status(200);
};
/*============================   SIGN IN ROUTES   ============================*/
const signIn = async (req, res) => {
  const { error, value } = validateSignIn(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const { email, password, rememberMe } = value;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user)
    return res.status(400).json({ message: "Invalid email or password." });
  if (user.accountLockedUntil && user.accountLockedUntil > new Date())
    return res.status(400).json({
      message: "This account is temporarily locked. Please try again later.",
    });

  const isPasswordValid = await comparePass(password, user.password);

  if (!isPasswordValid) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= 3) {
      user.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }

    await prisma.user.update({
      where: { email: email },
      data: {
        failedLoginAttempts: user.failedLoginAttempts,
        accountLockedUntil: user.accountLockedUntil,
      },
    });
    return res.status(400).json({ message: "Invalid email or password." });
  }

  await prisma.user.update({
    where: { email: email },
    data: { failedLoginAttempts: 0, accountLockedUntil: null },
  });

  const token = rememberMe
    ? await generateAuthToken(user, "7d")
    : await generateAuthToken(user);

  res
    .status(200)
    .json({ message: "User logged in successfully", token: token });
};

const currentUser = async (req, res) => {
  const { error, value } = validateEmail(req.body);
  if (error) return res.status(400).json({ message: error.message });
  const { email } = value;
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (!user) return res.status(200).json({ message: "user not found" });

  res.status(200).json({ name: user.username, email: user.email });
};

const signOut = async (req, res) => {
  res.status(200).json({ message: "User logged out successfully" });
};
const getUser = async (req, res) => {
  const { error, value } = validateEmail(req.body);
  if (error) return res.status(400).json({ message: error.message });
  const { email } = value;
  const user = await prisma.user.findUnique({
    where: { email: email },
  });
  if (!user) return res.status(200).json({ message: "user not found" });

  res.status(200).json({
    token: user.webAuthenToken,
  });
};

/*============================   ACCOUNT  RECOVERY     ============================*/
const sendPasswordResetLink = async (req, res) => {
  const { error, value } = validateEmail(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const { email } = value;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user)
    return res.status(400).json({
      message:
        "The email you entered does not match any account. Please check and try again",
    });

  await sendPasswordReset(user);

  res.send(
    "A password reset link has been sent to your email address. The link will expire in 3 minutes."
  );
};

const resetPassword = async (req, res) => {
  const { error, value } = validateSignIn(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const { email, password: newPassword } = value;
  const { token } = req.params;
  const user = await prisma.user.findUnique({
    where: {
      email: email,
      passwordResetToken: token,
    },
  });

  if (!user || user.passwordResetTokenExpires < new Date(Date.now())) {
    return res.status(400).json({ message: "invalid token" });
  }

  const oldPassword = await comparePass(newPassword, user.password);
  if (oldPassword)
    return res
      .status(400)
      .json({ message: "password cannot be the same as the old password" });

  const hashedPassword = await hashpass(newPassword);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetTokenExpires: null,
      failedLoginAttempts: 0,
      accountLockedUntil: null,
    },
  });

  res.json({ message: "password reset successful" }).status(200);
};

module.exports = {
  createNewUser,
  verifyEmail,
  getUser,
  resendEmailVerification,
  signIn,
  currentUser,
  signOut,
  sendPasswordResetLink,
  resetPassword,
};