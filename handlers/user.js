const prisma = require("../startup/db");
const { hashpass, generateAuthToken, comparePass } = require("../util/auth");
const {
  sendEmailVerification,
  sendPasswordReset,
  sendEmail,
} = require("../util/mail");
const {
  validateUser,
  validateSignIn,
  validateEmail,
  validateEnquiry,
} = require("../validators/user");
const NodeCache = require("node-cache");
const myCache = new NodeCache();
/*============================   SIGN UP ROUTES   ============================*/
const createNewUser = async (req, res) => {
  const { error, value } = validateUser(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { username, email, password } = value;
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res
      .status(400)
      .send(
        "There was an error with your registration. Please try registering again."
      );
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

  res.status(201).json({
    message:
      "User created successfully. Please check your email to verify your account",
    token: token,
  });
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

  try {
    let user = await prisma.user.findUnique({
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
    } else {
      user.failedLoginAttempts = 0;
      user.accountLockedUntil = null;
    }

    await prisma.user.update({
      where: { email: email },
      data: {
        failedLoginAttempts: user.failedLoginAttempts,
        accountLockedUntil: user.accountLockedUntil,
      },
    });

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const token = rememberMe
      ? await generateAuthToken(user, "7d")
      : await generateAuthToken(user);

    res.status(200).json({ message: "Success", token: token });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
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

  // Try getting user data from cache
  const cachedUser = myCache.get(email);

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { email: email },
  });
  if (!user) return res.status(200).json({ message: "user not found" });

  // If user is in cache and token hasn't changed, return cached user
  if (cachedUser && cachedUser.token === user.webAuthenToken) {
    return res.status(200).json(cachedUser);
  } else {
    // If user is not in cache or token has changed, update cache and return new user data
    const userData = {
      name: user.id,
      token: user.webAuthenToken,
    };
    myCache.set(email, userData, 3600);

    return res.status(200).json(userData);
  }
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

const enquiry = async (req, res) => {
  const { error, value } = validateEnquiry(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const { name, email, message } = value;

  await sendEmail(name, email, message);

  res.json({ message: "Enquiry received" });
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
  enquiry,
};
