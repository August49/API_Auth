const {
  createNewUser,
  verifyEmail,
  getUser,
  resendEmailVerification,
  currentUser,
  signIn,
  signOut,
  sendPasswordResetLink,
  resetPassword,
  enquiry,
} = require("../handlers/user");
const asyncMiddleware = require("../middleware/asyncMiddleware");
const rateLimit = require("express-rate-limit");
const express = require("express");
const { authn } = require("../util/auth");
const router = express.Router();

const limit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message:
    "Too many accounts created from this IP, please try again after an hour",
});

/*============================   SIGN UP ROUTES   ============================*/
router.post("/newUser", limit, asyncMiddleware(createNewUser));
router.get("/verifyEmail/:token", limit, asyncMiddleware(verifyEmail));
router.post(
  "/resendEmailVerification",
  asyncMiddleware(resendEmailVerification)
);

/*============================   SIGN IN ROUTES   ============================*/
router.post("/signIn", limit, asyncMiddleware(signIn));
router.get("/me", authn, asyncMiddleware(currentUser));
router.post("/options", asyncMiddleware(getUser));
router.post("/signOut", asyncMiddleware(signOut));
router.post("/enquiry", asyncMiddleware(enquiry));
/*============================   ACCOUNT  RECOVERY     ============================*/
router.post("/reset", asyncMiddleware(sendPasswordResetLink));
router.post("/reset/:token", asyncMiddleware(resetPassword));

module.exports = router;
