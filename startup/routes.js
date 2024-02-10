const errorHandler = require("../middleware/errorHandler");
const express = require("express");
const compression = require("compression");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const users = require("../routes/users");
const webauthnRouter = require("../routes/webauthen");
let isProduction = require("../config");
const secret = process.env.JWT_SECRET;

module.exports = function (app) {
  isProduction = isProduction.isProduction;

  app.use(express.json());
  app.use(
    cors({
      origin: isProduction
        ? "https://www.augustiniusjosephn.social"
        : "http://localhost:3000" || "http://192.168.1.6:3000",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  app.use(bodyParser.json());
  app.use(compression());
  app.use(cookieParser());
  app.use(
    session({
      secret: secret,
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: isProduction,
        httpOnly: true,
        sameSite: "strict",
      },
    })
  );
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "api-auth-8end.onrender.com"],
        imgSrc: ["'self'", "data:", "api-auth-8end.onrender.com"],
        connectSrc: ["'self'", "https://api-auth-8end.onrender.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static("public"));
  app.use(helmet());

  app.use(bodyParser.json());
  app.use("/api/users", users);
  app.use("/api/webauthn", webauthnRouter);
  app.use(errorHandler);
};
