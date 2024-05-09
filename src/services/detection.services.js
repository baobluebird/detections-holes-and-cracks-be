const Hole = require("../models/hole.model");
const Crack = require("../models/crack.model");
const cloudinary = require("cloudinary");
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.API_NAME_CLOUDINARY,
  api_key: process.env.API_KEY_CLOUDDINARY,
  api_secret: process.env.API_SECRET_CLOUDDINARY,
});

const createDetection = async (
  typeDetection,
  location,
  image,
  description,
  userId,
  address
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (typeDetection === "Ổ gà") {
        const hole = await Hole.create({
          name: "Ổ gà",
          user: userId,
          location: location,
          address: address,
          description: description,
        });

        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir);
        }

        const imagePath = path.join(uploadsDir, `${hole._id}.jpg`);
        fs.writeFileSync(imagePath, image.data);

        const savedImage = await cloudinary.uploader.upload(imagePath, {
          public_id: `hole_${hole._id}`,
          resource_type: "image"
        });

        fs.unlinkSync(imagePath);

        hole.image = savedImage.secure_url;
        await hole.save();

        resolve({
          image: image.data,
          data: hole,
          status: "OK",
          message: "Create hole successfully",
        });
      } else {
        const crack = await Crack.create({
          name: "Vết nứt",
          user: userId,
          location: location,
          address: address,
          description: description,
        });
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir);
        }

        const imagePath = path.join(uploadsDir, `${crack._id}.jpg`);
        fs.writeFileSync(imagePath, image.data);

        const savedImage = await cloudinary.uploader.upload(imagePath, {
          public_id: `crack_${crack._id}`,
          resource_type: "image"
        });

        fs.unlinkSync(imagePath);

        crack.image = savedImage.secure_url;
        await crack.save();

        resolve({
          image: image.data,
          data: crack,
          status: "OK",
          message: "Create crack successfully",
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

const getLatLongDetection = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const latLongSmallHole = await Hole.find({
        description: { $in: ["Small"] },
      }).select("location");
      const latLongLargeHole = await Hole.find({
        description: { $in: ["Large"] },
      }).select("location");
      const latLongSmallCrack = await Crack.find({
        description: { $in: ["Small"] },
      }).select("location");
      const latLongLargeCrack = await Crack.find({
        description: { $in: ["Large"] },
      }).select("location");
      const formatLatLng = (latLngObjects) => {
        return latLngObjects
          .map((obj) => {
            const matches = obj.location.match(
              /LatLng\(latitude:(.*), longitude:(.*)\)/
            );
            if (matches && matches.length === 3) {
              return [parseFloat(matches[1]), parseFloat(matches[2])];
            } else {
              return null; 
            }
          })
          .filter(Boolean);
      };
      const formattedLatLongSmallHole = formatLatLng(latLongSmallHole);
      const formattedLatLongLargeHole = formatLatLng(latLongLargeHole);
      const formattedLatLongSmallCrack = formatLatLng(latLongSmallCrack);
      const formattedLatLongLargeCrack = formatLatLng(latLongLargeCrack);

      resolve({
        latLongSmallHole: formattedLatLongSmallHole,
        latLongLargeHole: formattedLatLongLargeHole,
        latLongSmallCrack: formattedLatLongSmallCrack,
        latLongLargeCrack: formattedLatLongLargeCrack,
        status: "OK",
        message: "Create crack successfully",
      });
    } catch (error) {
      reject(error);
    }
  });
};

const getListHoles = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const holes = await Hole.find().select("-image");
      resolve({
        data: holes,
        status: "OK",
        message: "Get list holes successfully",
      });
    } catch (error) {
      reject(error);
    }
  });
};

const getListCracks = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const cracks = await Crack.find().select("-image");
      resolve({
        data: cracks,
        status: "OK",
        message: "Get list cracks successfully",
      });
    } catch (error) {
      reject(error);
    }
  });
};

const getDetailHole = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const hole = await Hole.findById(id);
      resolve({
        image: hole.image,
        data: hole,
        status: "OK",
        message: "Get detail hole successfully",
      });
    } catch (error) {
      reject(error);
    }
  });
};

const getDetailCrack = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const crack = await Crack.findById(id);
      resolve({
        image: crack.image,
        data: crack,
        status: "OK",
        message: "Get detail crack successfully",
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  createDetection,
  getLatLongDetection,
  getListHoles,
  getListCracks,
  getDetailHole,
  getDetailCrack,
};
