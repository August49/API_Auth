const prisma = require("../startup/db");
const {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} = require("@simplewebauthn/server");
const {
  isoBase64URL,
  isoUint8Array,
} = require("@simplewebauthn/server/helpers");

const logger = require("../startup/log");
// const rpName = "SimpleWebAuthn Example";
// const rpID = "localhost";
// const origin = `http://${rpID}:3000`;
const rpName = "SimpleWebAuthn Example";
const rpID =
  process.env.NODE_ENV === "production" ? process.env.RP_ID : "localhost";
const origin =
  process.env.NODE_ENV === "production"
    ? `https://${rpID}`
    : `http://${rpID}:3000`;
const rememberMe = true;
const expectedOrigin = origin || "https://www.augustiniusjosephn.social";

const registrationOptions = async (req, res) => {
  const { id } = req.user;
  const user = await prisma.user.findUnique({
    where: { id: id },
    include: { authenticators: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: user.id.toString(),
    userName: user.username,
    attestationType: "none",
    excludeCredentials:
      user && user.authenticators
        ? user.authenticators.map((authenticator) => ({
            id: authenticator.credentialId,
            type: "public-key",
            transports: authenticator.transports,
          }))
        : [],
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform",
    },
  });

  // Remember the challenge for this user
  await prisma.user.update({
    where: { id: id },
    data: { currentChallenge: options.challenge },
  });

  res.json(options);
};

const verifyRegistration = async (req, res) => {
  const body = req.body.data;
  const { id } = req.user;

  // Retrieve the logged-in user
  const user = await prisma.user.findUnique({
    where: { id: id },
    include: { authenticators: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!body || !body.id || !body.rawId || !body.response) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const expectedChallenge = user.currentChallenge;
  const options = {
    response: {
      attestationObject: isoBase64URL.toBuffer(body.response.attestationObject),
      clientDataJSON: isoBase64URL.toBuffer(body.response.clientDataJSON),
      id: body.id,
      rawId: body.rawId,
      type: "public-key",
      response: body.response,
      clientExtensionResults: body.clientExtensionResults,
    },
  };

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      ...options,
      expectedChallenge: `${expectedChallenge}`,
      expectedOrigin: expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
  } catch (error) {
    logger.error(error);
    return res.status(400).send({ error: error.message });
  }

  const { verified } = verification;

  if (verified) {
    const { credentialPublicKey, credentialID, counter } =
      verification.registrationInfo;

    await prisma.authenticator.create({
      data: {
        credentialBackedUp: false,
        credentialDeviceType: "platform",
        credentialId: Buffer.from(credentialID),
        transports: body.response.transports,
        credentialPublicKey: Buffer.from(credentialPublicKey),
        counter,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { webAuthenToken: true },
    });
  }

  res.json({ verified });
};

const webauthloginOptions = async (req, res) => {
  const email = req.body.email;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const user = await prisma.user.findUnique({
    where: { email: email },
    include: { authenticators: true },
  });

  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  const opts = {
    timeout: 60000,
    allowCredentials: user.authenticators.map((dev) => ({
      id: dev.credentialId,
      type: "public-key",
      transports: dev.transports,
    })),

    userVerification: "preferred",
    rpID,
  };

  const loginOpts = await generateAuthenticationOptions(opts);

  await prisma.user.update({
    where: { email: email },
    data: { currentChallenge: loginOpts.challenge },
  });

  res.send(loginOpts);
};

const webauthLoginVerification = async (req, res) => {
  const body = req.body.data;
  const email = req.body.data.email;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  const user = await prisma.user.findUnique({
    where: { email: email },
    include: { authenticators: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!body.id || !body.rawId) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const expectedChallenge = user.currentChallenge;

  let dbAuthenticator;
  const bodyCredIDBuffer = isoBase64URL.toBuffer(body.id);
  for (const dev of user.authenticators) {
    if (isoUint8Array.areEqual(dev.credentialId, bodyCredIDBuffer)) {
      dbAuthenticator = dev;
      break;
    }
  }

  if (!dbAuthenticator) {
    return res.status(400).send({
      error: "Authenticator is not registered with this site",
    });
  }

  let verification;
  try {
    const opts = {
      response: body,
      expectedChallenge: `${expectedChallenge}`,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: dbAuthenticator,
      requireUserVerification: false,
    };
    verification = await verifyAuthenticationResponse(opts);
  } catch (error) {
    const _error = error;
    logger.error(_error);
    return res.status(400).send({ error: _error.message });
  }

  const { verified, authenticationInfo } = verification;

  if (verified) {
    const { newCounter } = authenticationInfo;
    await prisma.authenticator.update({
      where: { credentialId: Buffer.from(dbAuthenticator.credentialId) },
      data: { counter: newCounter },
    });
  }
  if (!verified) {
    return res.status(400).send({ error: "Verification failed" });
  }

  // Set the user data in the session
  req.session.user = {
    id: user.id,
    role: user.role,
    username: user.username,
    email: user.email,
  };

  res.json({ verified: verified, user: req.session.user });
};

module.exports = {
  registrationOptions,
  verifyRegistration,
  webauthloginOptions,
  webauthLoginVerification,
};
