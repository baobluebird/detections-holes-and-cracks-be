const Hole = require("../models/hole.model");
const Crack = require("../models/crack.model");
const Road = require("../models/road.model");
const dotenv = require("dotenv");
const axios = require('axios');
dotenv.config();
const path = require("path");
const fs = require("fs");
const geolib = require('geolib');
const cloudinary = require("cloudinary");
cloudinary.config({
  cloud_name: process.env.API_NAME_CLOUDINARY,
  api_key: process.env.API_KEY_CLOUDDINARY,
  api_secret: process.env.API_SECRET_CLOUDDINARY,
});


const createDetection = async (
  typeDetection,
  location,
  image,
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
        
        const url = `${process.env.URL_VPS_HOLE}/process-image?image_url=${savedImage.secure_url}`;

        const response = await axios.post(url);
        if(response.data.result == 'No detection'){
          //delete hole
          await Hole.findByIdAndDelete(hole._id);
          resolve({
            status: "ERR",
            message: "No detection",
          });
        }
        hole.image = response.data.image_url;
        hole.description = response.data.result;
        await hole.save();

        resolve({
          image: response.data.image_url,
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
        const url = `${process.env.URL_VPS_CRACK}/process-image?image_url=${savedImage.secure_url}`;

        const response = await axios.post(url);
        if(response.data.result == 'No detection'){
          //delete hole
          await Crack.findByIdAndDelete(crack._id);
          resolve({
            status: "ERR",
            message: "No detection",
          });
        }
        crack.image = response.data.image_url;
        crack.description = response.data.result;

        await crack.save();

        resolve({
          image: response.data.image_url,
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
      const holes = await Hole.find();
      const count = await Hole.countDocuments();
      resolve({
        total: count,
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
      const cracks = await Crack.find();
      const count = await Crack.countDocuments();

      resolve({
        total: count,
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

const getListForTracking = (coordinates) => {
  return new Promise(async (resolve, reject) => {
    try {
      const latLongLargeHole = await Hole.find({ description: { $in: ["Large"] } }).select("location");
      const latLongMaintainRoad = await Road.find().select("locationA");
      const formatLatLng = (latLngObjects) => {
        return latLngObjects
          .map((obj) => {
            const matches = obj.location.match(/LatLng\(latitude:(.*), longitude:(.*)\)/);
            if (matches && matches.length === 3) {
              return { latitude: parseFloat(matches[1]), longitude: parseFloat(matches[2]) };
            } else {
              return null; 
            }
          })
          .filter(Boolean);
      };

      const formatLatLngMaintainRoad = (latLngObjects) => {
        return latLngObjects
          .map((obj) => {
            const matches = obj.locationA.match(/LatLng\((.*), (.*)\)/);
            if (matches && matches.length === 3) {
              return { latitude: parseFloat(matches[1]), longitude: parseFloat(matches[2]) };
            } else {
              return null; 
            }
          })
          .filter(Boolean);
      };


      const formattedLatLongLargeHole = formatLatLng(latLongLargeHole);

      const formattedLatLongMaintainRoad= formatLatLngMaintainRoad(latLongMaintainRoad);
      
      const allKnownCoordinatesHole = [
        ...formattedLatLongLargeHole,
      ];

      const allKnownCoordinatesMaintainRoad = [
        ...formattedLatLongMaintainRoad,
      ];

      const matchingCoordinatesHole = new Set();
      const matchingCoordinatesMaintainRoad = new Set();


      coordinates.forEach((coord) => {
        allKnownCoordinatesHole.forEach((knownCoord) => {
          const distance = geolib.getDistance(
            { latitude: coord.latitude, longitude: coord.longitude },
            { latitude: knownCoord.latitude, longitude: knownCoord.longitude }
          );
          if (distance <= 80) {
            matchingCoordinatesHole.add(JSON.stringify([knownCoord.latitude, knownCoord.longitude]));
          }
        });
      });

      coordinates.forEach((coord) => {
        allKnownCoordinatesMaintainRoad.forEach((knownCoord) => {
          const distance = geolib.getDistance(
            { latitude: coord.latitude, longitude: coord.longitude },
            { latitude: knownCoord.latitude, longitude: knownCoord.longitude }
          );
          if (distance <= 80) {
            matchingCoordinatesMaintainRoad.add(JSON.stringify([knownCoord.latitude, knownCoord.longitude]));
          }
        });
      });


      console.log(Array.from(matchingCoordinatesMaintainRoad).map(JSON.parse))
      resolve({
        status: "OK",
        matchingCoordinatesHole: Array.from(matchingCoordinatesHole).map(JSON.parse),
        matchingCoordinatesMaintainRoad: Array.from(matchingCoordinatesMaintainRoad).map(JSON.parse),
        message: "Data for tracking response successfully",
      });
    } catch (error) {
      reject(error);
    }
  });
};

const deleteHole = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const check = await Hole.findById(id);
      if(!check){
        reject({
          status: "ERR",
          message: "Hole not found",
        });
      }
      await Hole.findByIdAndDelete(id);
      resolve({
        status: "OK",
        message: "Delete hole successfully",
      });
    } catch (error) {
      reject(error);
    }
  });
};

const deleteCrack = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const check = await Crack.findById(id);
      if(!check){
        reject({
          status: "ERR",
          message: "Crack not found",
        });
      }
      await Crack.findByIdAndDelete(id);
      resolve({
        status: "OK",
        message: "Delete crack successfully",
      });
    } catch (error) {
      reject(error);
    }
  });
};

function getLocationCoordinates(locationStringA, locationStringB) {
  const startIndexA = locationStringA.indexOf("(");
  const endIndexA = locationStringA.indexOf(")");

  const startIndexB = locationStringB.indexOf("(");
  const endIndexB = locationStringB.indexOf(")");
  
  if (startIndexA !== -1 && endIndexA !== -1 ) {
    const latLngStringA = locationStringA.substring(startIndexA + 1, endIndexA);
    const latLngPartsA = latLngStringA.split(", ");

    const latLngStringB = locationStringB.substring(startIndexB + 1, endIndexB);
    const latLngPartsB = latLngStringB.split(", ");

    const latitudeA = parseFloat(latLngPartsA[0]);
    const longitudeA = parseFloat(latLngPartsA[1]);

    const latitudeB = parseFloat(latLngPartsB[0]);
    const longitudeB = parseFloat(latLngPartsB[1]);

    return { latitudeA, longitudeA, latitudeB, longitudeB };
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

const createMaintainRoad = (locationA, locationB, date) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { latitudeA, longitudeA, latitudeB, longitudeB} = await getLocationCoordinates(locationA, locationB);

      const addressA = await getAddressFromCoordinates(latitudeA, longitudeA);
      const addressB = await getAddressFromCoordinates(latitudeB, longitudeB);

      const createMaintain = await Road.create({
        sourceName: addressA,
        destinationName: addressB,
        locationA: locationA,
        locationB: locationB,
        dateMaintain: date
      }); 
      if(createMaintain)    {
        resolve({
          status: "OK",
          data: createMaintain,
          message: "Create maintain road successfully",
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

const getMaintainRoad =  () => {
  return new Promise(async (resolve, reject) => {
    try {
      
      const data = await Road.find()
      if(data)    {
        resolve({
          status: "OK",
          data: data,
          message: "Get data maintain road successfully",
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

const getMaintainRoadForMap =  () => {
  return new Promise(async (resolve, reject) => {
    try {
      
      const data = await Road.find().select('locationA locationB -_id');
      if(data)    {
        resolve({
          status: "OK",
          data: data,
          message: "Get data maintain road successfully",
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

const deleteMaintain =  (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      
      await Road.findByIdAndDelete(id)
        resolve({
          status: "OK",
          message: "Delete maintain road successfully",
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
  getListForTracking,
  deleteHole,
  deleteCrack,
  createMaintainRoad,
  getMaintainRoad,
  getMaintainRoadForMap,
  deleteMaintain
};
