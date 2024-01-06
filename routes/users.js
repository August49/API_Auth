const { createNewUser, verifyEmail } = require("../handlers/user");
const asyncMiddleware = require("../middleware/asyncMiddleware");
const express = require("express");

const router = express.Router();

router.post("/newUser", asyncMiddleware(createNewUser));
router.get("/verifyEmail/:token", asyncMiddleware(verifyEmail));

module.exports = router;
