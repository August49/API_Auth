const {
  registrationOptions,
  verifyRegistration,
  webauthLoginVerification,
  webauthloginOptions,
} = require("../handlers/webAuthen");
const asyncMiddleware = require("../middleware/asyncMiddleware");
const { Router } = require("express");
const { authn } = require("../util/auth");

const webauthnRouter = Router();

webauthnRouter.post(
  "/registration-options",
  authn,
  asyncMiddleware(registrationOptions)
);

webauthnRouter.post(
  "/verify-registration",
  authn,
  asyncMiddleware(verifyRegistration)
);
webauthnRouter.post("/login-options", asyncMiddleware(webauthloginOptions));
webauthnRouter.post(
  "/login-verification",
  asyncMiddleware(webauthLoginVerification)
);

module.exports = webauthnRouter;
