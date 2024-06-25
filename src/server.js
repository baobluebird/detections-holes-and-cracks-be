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
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));


configViewEngine(app);

routes(app);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to the database!");
  })

  .catch((err) => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

function getLocationCoordinates(locationString) {
  const startIndex = locationString.indexOf("(");
  const endIndex = locationString.indexOf(")");

  if (startIndex !== -1 && endIndex !== -1) {
    const latLngString = locationString.substring(startIndex + 1, endIndex);

    const latLngParts = latLngString.split(", ");

    const latitude = parseFloat(latLngParts[0].split(":")[1]);
    const longitude = parseFloat(latLngParts[1].split(":")[1]);

    return { latitude, longitude };
  } else {
    console.log("Invalid location string format");
    return null;
  }
}

async function getAddressFromCoordinates(latitude, longitude) {
  try {
    const apiKey = process.env.API_GOOGLE_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

    const response = await axios.get(url);
    const address = response.data.results[0].formatted_address;
    return address;
  } catch (error) {
    console.error("Error fetching address:", error.message);
    return null;
  }
}

app.post("/api/detection/create", upload.single("image"), async (req, res) => {
  try {
    console.log(req.body);

    const image = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    };

    const { typeDetection, location, userId } = req.body;

    const { latitude, longitude } = getLocationCoordinates(location);
    const address = await getAddressFromCoordinates(latitude, longitude);
    if (
      !typeDetection ||
      !location ||
      !image ||
      !userId ||
      !address
    ) {
      return res.status(200).json({
        status: "ERR",
        message: "The input is required",
      });
    }

    

    const response = await DetectionService.createDetection(
      typeDetection,
      location,
      image,
      userId,
      address
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});
