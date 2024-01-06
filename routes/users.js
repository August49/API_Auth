const { createNewUser } = require("../handlers/user");
const asyncMiddleware = require("../middleware/asyncMiddleware");
const express = require("express");

const router = express.Router();

router.post("/newUser", asyncMiddleware(createNewUser));

module.exports = router;
