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
} = require("../handlers/user");
const asyncMiddleware = require("../middleware/asyncMiddleware");
const express = require("express");
const { authn } = require("../util/auth");
const limit = require("../util/limiter");
const router = express.Router();

/*============================   SIGN UP ROUTES   ============================*/
router.post("/newUser", limit, asyncMiddleware(createNewUser));
router.get("/verifyEmail/:token", limit, asyncMiddleware(verifyEmail));
router.post(
  "/resendEmailVerification",
  asyncMiddleware(resendEmailVerification)
);

/*============================   SIGN IN ROUTES   ============================*/
router.post("/signIn", limit, asyncMiddleware(signIn));
router.post("/me", authn, asyncMiddleware(currentUser));
router.post("/options", asyncMiddleware(getUser));
router.post("/signOut", asyncMiddleware(signOut));
/*============================   ACCOUNT  RECOVERY     ============================*/
router.post("/reset", asyncMiddleware(sendPasswordResetLink));
router.post("/reset/:token", asyncMiddleware(resetPassword));

module.exports = router;
