const errorHandler = require("../middleware/errorHandler");
const express = require("express");
const compression = require("compression");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const cors = require("cors");
const users = require("../routes/users");
const webauthnRouter = require("../routes/webauthen");

module.exports = function (app) {
  app.use(express.json());
  // app.use(
  //   cors({
  //     origin: [
  //       "http://localhost:3000",
  //       "https://api-auth-8end.onrender.com",
  //       "https://api-auth-8end.onrender.com/",
  //     ],
  //     optionsSuccessStatus: 200,
  //   })
  // );
  app.use(cors());
  app.use(bodyParser.json());
  app.use(compression());
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
