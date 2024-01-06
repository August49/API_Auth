const { createNewUser, verifyEmail } = require("../handlers/user");
const asyncMiddleware = require("../middleware/asyncMiddleware");
const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const limit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many request from this IP , please try again after 15 minutes",
});

router.post("/newUser", limit, asyncMiddleware(createNewUser));
router.get("/verifyEmail/:token", limit, asyncMiddleware(verifyEmail));

module.exports = router;
