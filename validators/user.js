const joi = require("joi");

const userSchema = joi
  .object({
    username: joi.string().min(3).required(),
    email: joi.string().email().required(),
    password: joi.string().min(8).required(),
  })
  .error(() => "Invalid user data");

const loginSchema = joi.object({
  email: joi.string().email().required().messages({
    "string.email": "Invalid email or password",
    "any.required": "Invalid email or password",
  }),
  password: joi.string().min(8).required().messages({
    "string.min": "Invalid email or password",
    "any.required": "Invalid email or password",
  }),
  rememberMe: joi.boolean().messages({
    "any.required": "Invalid email or password",
  }),
});

const enquirySchema = joi
  .object({
    name: joi.string().required(),
    email: joi.string().email().required(),
    message: joi.string().required().min(10).max(200),
  })
  .messages({
    "string.email": "Invalid email",
    "any.required": "Invalid email",
  });

const emailSchema = joi.object({
  email: joi.string().email().required().messages({
    "string.email": "Invalid email",
    "any.required": "Invalid email",
  }),
});

function validateEnquiry(enquiry) {
  return enquirySchema.validate(enquiry);
}

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
  validateEnquiry,
};
