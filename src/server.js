const express = require("express");
const multer = require("multer");
const dotenv = require("dotenv");
const axios = require("axios");
const mongoose = require("mongoose");
const routes = require("./routes/api/api");
const cors = require("cors");
const bodyParser = require("body-parser");
dotenv.config();
const configViewEngine = require("./config/viewEngine");
const port = process.env.PORT || 3001;
const app = express();
const DetectionService = require("./services/detection.services");

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

configViewEngine(app);

// Pass the upload middleware to the routes
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
routes(app, upload);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch((err) => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });


io.on('connection', (socket) => {
  console.log('have user connect:>> ', socket.id);
  io.emit('newUserConnect', 'Have user connect');
});

server.listen(port, () => {
  console.log('Server is running on port', port);
});

global.io = io;