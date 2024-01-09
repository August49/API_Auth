const joi = require("joi");

const userSchema = joi.object({
  username: joi.string().min(3).required(),
  email: joi.string().email().required(),
  password: joi.string().min(8).required(),
});

const loginSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().min(8).required(),
  rememberMe: joi.boolean().required(),
});

const emailSchema = joi.object({
  email: joi.string().email().required(),
});

function validateEmail(email) {
  return emailSchema.validate(email);
}

function validateUser(user) {
  return userSchema.validate(user);
}

function validateSignIn(user) {
  return loginSchema.validate(user);
}

module.exports = {
  validateUser,
  validateSignIn,
  validateEmail,
};
