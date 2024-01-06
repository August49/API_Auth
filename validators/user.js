const joi = require("joi");

const userSchema = joi.object({
  username: joi.string().min(3).required(),
  email: joi.string().email().required(),
  password: joi.string().min(8).required(),
});

const loginSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().min(8).required(),
});

function validateUser(user) {
  return userSchema.validate(user);
}

function validateLogin(user) {
  return loginSchema.validate(user);
}

module.exports = {
  validateUser,
  validateLogin,
};
