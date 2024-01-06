const express = require("express");
const dotenv = require("dotenv");
const errorHandler = require("./middleware/errorHandler");
const routes = require("./startup/routes");
dotenv.config();

const app = express();
routes(app);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

module.exports = app;
