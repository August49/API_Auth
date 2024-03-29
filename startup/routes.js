const errorHandler = require("../middleware/errorHandler");
const express = require("express");
const compression = require("compression");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const KnexSessionStore = require("connect-session-knex")(session);
const users = require("../routes/users");
const Knex = require("knex");
const webauthnRouter = require("../routes/webauthen");
let isProduction = require("../config");
const secret = process.env.JWT_SECRET;

module.exports = function (app) {
  isProduction = isProduction.isProduction;
  const knex = Knex({
    client: "sqlite3",
    connection: {
      filename: "./mydb.sqlite",
    },
    useNullAsDefault: true,
  });

  const store = new KnexSessionStore({
    knex: knex,
    tablename: "sessions", // optional. Defaults to 'sessions'
  });

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
  app.use(compression());
  app.use(cookieParser());
  app.use(
    session({
      secret: secret,
      resave: false,
      store: store,
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

  app.use("/api/users", users);
  app.use("/api/webauthn", webauthnRouter);
  app.use(errorHandler);
};
