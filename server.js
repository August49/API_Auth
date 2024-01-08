const express = require("express");
const dotenv = require("dotenv");
const errorHandler = require("./middleware/errorHandler");
const routes = require("./startup/routes");
dotenv.config();

const app = express();
app.set("trust proxy", 1);
app.get("/ip", (request, response) => response.send(request.ip));
routes(app);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

module.exports = app;
