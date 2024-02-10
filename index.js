const cluster = require("cluster");
const http = require("http");
const numCPUs = require("os").cpus().length;
const express = require("express");
const dotenv = require("dotenv");
const errorHandler = require("./middleware/errorHandler");
const routes = require("./startup/routes");
const morgan = require("morgan");
dotenv.config();
const port = process.env.PORT;
const host = process.env.HOST;

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
  app.use(morgan("dev"));
  app.set("trust proxy", 1);
  app.get("/ip", (request, response) => response.send(request.ip));
  routes(app);

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.listen(port, host, () => {
    //host
    console.log(`Server is running on http://${host}:${port}`);
  });
}
