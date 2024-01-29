const crypto = require("crypto");
const nodemailer = require("nodemailer");
const prisma = require("../startup/db");
const logger = require("../startup/log");

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  service: "gmail",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const buttonStyle = `
  background-color: #4CAF50;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 12px;
`;

const IP = process.env.IP;
const PORT = process.env.PORT;
const token = crypto.randomBytes(20).toString("hex");
const URL = "https://api-auth-8end.onrender.com";

/*============================   SEND EMAIL VERIFICATION LINK   ============================*/

const sendEmailVerification = async (user) => {
  // const link = `http://${IP.trim()}:${PORT}/api/users/verifyemail/${token}`;
  const link = `${URL}/api/users/verifyemail/${token}`;
  const encodedLink = encodeURI(link);

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: token,
        emailVerificationTokenExpires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    let mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: user.email,
      subject: "Verify Email",
      html: `<p>Please click on the following button to reset your password:</p>
           <a href="${encodedLink}" style="${buttonStyle}">Reset Password</a>`,
    };

    await transporter.sendMail(mailOptions);
    logger.info("Email verification link sent to " + user.email);
  } catch (error) {
    logger.error("Failed to send email verification link: ", error);
  }
};

/*============================   SEND PASSWORD RESET LINK     ============================*/

const sendPasswordReset = async (user) => {
  const link = `${URL}/api/users/resetPassword/${token}`;
  const encodedLink = encodeURI(link);
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetTokenExpires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    let mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: user.email,
      subject: "Password Reset",
      html: `<p>Please click on the following button to reset your password:</p>
         <a href="${encodedLink}" style="${buttonStyle}">Reset Password</a>`,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    logger.error("Failed to send email verification link: ", error);
  }
};

const sendEmail = async (name, email, message) => {
  try {
    let mailOptions = {
      from: email,
      to: process.env.EMAIL_USERNAME,
      subject: "Enquiry",
      html: `<p>Name: ${name}</p>
             <p>Email: ${email}</p>
             <p>Message: ${message}</p>`,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    logger.error("Failed to send email verification link: ", error);
  }
};

module.exports = {
  sendEmailVerification,
  sendPasswordReset,
  sendEmail,
};
