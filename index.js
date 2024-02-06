const cluster = require("cluster");
const http = require("http");
const numCPUs = require("os").cpus().length;
const express = require("express");
const dotenv = require("dotenv");
const errorHandler = require("./middleware/errorHandler");
const routes = require("./startup/routes");
dotenv.config();

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  const app = express();
  app.set("trust proxy", 1);
  app.get("/ip", (request, response) => response.send(request.ip));
  routes(app);

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.listen(5000, () => {
    console.log(`Worker ${process.pid} started`);
  });
}
