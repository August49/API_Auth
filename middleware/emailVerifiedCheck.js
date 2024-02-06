const emailVerified = async (req, res, next) => {
  let user;
  try {
    user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });
  } catch (error) {
    next(error);
  }
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!user.emailVerified) {
    return res.status(403).json({ message: "Email not verified" });
  }

  next();
};

module.exports = emailVerified;
