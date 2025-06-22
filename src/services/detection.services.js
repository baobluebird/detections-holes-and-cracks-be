const Hole = require("../models/hole.model");
const Crack = require("../models/crack.model");
const Road = require("../models/road.model");
const Damage = require("../models/damage.model");

const axios = require('axios');
const moment = require("moment-timezone");
const ExcelJS = require('exceljs');
const dotenv = require("dotenv");
dotenv.config();
const fs = require('fs');
const path = require('path');
const geolib = require('geolib');
const cloudinary = require("cloudinary");


cloudinary.config({
  cloud_name: process.env.API_NAME_CLOUDINARY,
  api_key: process.env.API_KEY_CLOUDDINARY,
  api_secret: process.env.API_SECRET_CLOUDDINARY,
});

const parseLatLng = (locationStr) => {
  try {
    if (Array.isArray(locationStr) && locationStr.length === 2) {
      return locationStr; // Nếu đã là mảng [lat, lng], trả về luôn
    }
    const match = locationStr.match(/LatLng\(latitude:([\d.-]+),\s*longitude:([\d.-]+)\)/);
    if (!match) return null;
    const [_, latitude, longitude] = match;
    return [parseFloat(latitude), parseFloat(longitude)];
  } catch {
    return null;
  }
};

function calculateDistance(locationA, locationB) {
  try {
    const [lat1, lon1] = locationA.split(',').map(Number);
    const [lat2, lon2] = locationB.split(',').map(Number);
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Khoảng cách (km)
  } catch (error) {
    throw new Error('Invalid location format. Expected "lat,lon".');
  }
}

function getLocationCoordinates(locationStringA, locationStringB) {
  const startIndexA = locationStringA.indexOf("(");
  const endIndexA = locationStringA.indexOf(")");

  const startIndexB = locationStringB.indexOf("(");
  const endIndexB = locationStringB.indexOf(")");

  if (startIndexA !== -1 && endIndexA !== -1) {
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

const createDetection = async (
  typeDetection,
  location,
  image,
  userId,
  address
) => {
  return new Promise(async (resolve, reject) => {
    console.log("create by phone")
    const io = global.io;
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
        const url = `${process.env.URL_VPS_DETECT}/process-image/pothole?image_url=${savedImage.secure_url}`;

        let response = await axios.post(url);
        console.log("response", response.data);

        if (response.data.result == 'No detection') {
          //delete hole
          await Hole.findByIdAndDelete(hole._id);
          resolve({
            status: "ERR",
            message: "No detection",
          });
        }
        hole.image = response.data.image;
        hole.description = response.data.description;
        await hole.save();
        console.log(hole)
        io.emit("newDataAdded", hole);
        resolve({
          image: response.data.image,
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
        const url = `${process.env.URL_VPS_DETECT}/process-image/crack?image_url=${savedImage.secure_url}`;

        let response = await axios.post(url);
        console.log("response", response.data);

        if (response.data.result == 'No detection') {
          //delete hole
          await Crack.findByIdAndDelete(crack._id);
          resolve({
            status: "ERR",
            message: "No detection",
          });
        }
        crack.image = response.data.image;
        crack.description = response.data.description;

        await crack.save();
        io.emit("newDataAdded", crack);
        resolve({
          image: response.data.image,
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

const checkCoordinates = (type, coordinates) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("check coordinates", type, coordinates);

      // Parse coordinates đầu vào
      const parsedCoords = parseLatLng(coordinates);
      if (!parsedCoords) {
        reject({
          status: 'ERR',
          message: 'Invalid coordinates format. Must be [latitude, longitude] or LatLng(latitude:X, longitude:Y)',
        });
        return;
      }

      const [lat, lng] = parsedCoords;
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
        reject({
          status: 'ERR',
          message: 'Latitude and longitude must be valid numbers',
        });
        return;
      }

      // Map Vietnamese types to English
      const typeMap = {
        'ổ gà': 'hole',
        'vết nứt': 'crack',
        'all': 'all',
      };
      const validType = typeMap[type.toLowerCase()] || type.toLowerCase();
      const validTypes = ['crack', 'hole', 'all'];
      if (!validTypes.includes(validType)) {
        reject({
          status: 'ERR',
          message: 'Type must be "crack", "hole", "all", "ổ gà", or "vết nứt"',
        });
        return;
      }

      // Lấy dữ liệu từ database dựa trên type
      let items;
      if (validType === 'crack') {
        items = await Crack.find().exec();
      } else if (validType === 'hole') {
        items = await Hole.find().exec();
      } else {
        const cracks = await Crack.find().exec();
        const holes = await Hole.find().exec();
        items = [...cracks, ...holes];
      }

      if (!items || items.length === 0) {
        resolve({
          status: 'OK',
          message: 'No items found in database',
          data: [],
        });
        return;
      }

      // Parse location và lọc các location hợp lệ
      const parsedLocations = items
        .map(item => ({
          item,
          coords: parseLatLng(item.location),
        }))
        .filter(loc => loc.coords !== null);

      if (parsedLocations.length === 0) {
        resolve({
          status: 'OK',
          message: 'No valid locations found in database',
          data: [],
        });
        return;
      }

      // Tính khoảng cách và lọc các địa điểm trong bán kính 20m
      const radius = 20; // Bán kính 20m
      const origin = { latitude: lat, longitude: lng };
      const nearbyItems = parsedLocations
        .filter(loc => {
          const newCoords = { latitude: loc.coords[0], longitude: loc.coords[1] };
          const distance = geolib.getDistance(origin, newCoords);
          return distance <= radius;
        })
        .map(loc => ({
          _id: loc.item._id,
          name: loc.item.name,
          location: loc.item.location,
          address: loc.item.address,
          image: loc.item.image,
          description: loc.item.description,
          type: loc.item instanceof Crack ? 'crack' : 'hole',
          createdAt: loc.item.createdAt,
          updatedAt: loc.item.updatedAt,
        }));

      resolve({
        status: 'OK',
        message: nearbyItems.length > 0 ? 'Found items within 20m radius' : 'No items found within 20m radius',
        data: nearbyItems,
      });
    } catch (error) {
      reject({
        status: 'ERR',
        message: error.message || 'An unexpected error occurred',
      });
    }
  });
};

const createDetectionForJetson = async (typeDetection, location, image, userId, address, description) => {
  const io = global.io;
  return new Promise(async (resolve, reject) => {
    try {
      let detection;
      let model;
      let prefix;

      if (typeDetection === "Ổ gà") {
        model = Hole;
        prefix = "hole";
      } else if (typeDetection === "Vết nứt") {
        model = Crack;
        prefix = "crack";
      } else {
        reject({ status: "ERR", message: "Invalid typeDetection" });
        return;
      }

      detection = await model.create({
        name: typeDetection,
        user: userId,
        description: description,
        location: location,
        address: address,
      });

      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
      }

      const imagePath = path.join(uploadsDir, `${detection._id}.jpg`);
      fs.writeFileSync(imagePath, image.data);

      const savedImage = await cloudinary.uploader.upload(imagePath, {
        public_id: `${prefix}_${detection._id}`,
        resource_type: "image"
      });

      fs.unlinkSync(imagePath);

      detection.image = savedImage.secure_url;
      await detection.save();
      console.log(detection)
      io.emit("newDataAdded", detection)
      resolve({
        image: savedImage.secure_url,
        data: detection,
        status: "OK",
        message: `Create ${typeDetection} successfully`,
      });
    } catch (error) {
      reject(error);
    }
  });
};

const createMaintainRoad = (locationA, locationB, startDate, endDate, totalDays) => {
  const io = global.io;
  return new Promise(async (resolve, reject) => {
    try {
      const { latitudeA, longitudeA, latitudeB, longitudeB } = await getLocationCoordinates(locationA, locationB);

      const addressA = await getAddressFromCoordinates(latitudeA, longitudeA);
      const addressB = await getAddressFromCoordinates(latitudeB, longitudeB);
      const createMaintain = await Road.create({
        sourceName: addressA,
        destinationName: addressB,
        locationA: locationA,
        locationB: locationB,
        startDate: startDate,
        endDate: endDate,
        dateMaintain: totalDays
      });

      if (createMaintain) {
        io.emit('newMaintainRoad', {
          id: createMaintain._id.toString(),
          sourceName: createMaintain.sourceName,
          destinationName: createMaintain.destinationName,
          locationA: createMaintain.locationA,
          locationB: createMaintain.locationB,
          startDate: createMaintain.startDate,
          endDate: createMaintain.endDate,
          dateMaintain: createMaintain.dateMaintain,
          createdAt: createMaintain.createdAt.toISOString(),
          updatedAt: createMaintain.updatedAt.toISOString()
        });
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

const createDamageRoad = (name, locationA, locationB) => {
  const io = global.io;
  return new Promise(async (resolve, reject) => {
    try {

      const { latitudeA, longitudeA, latitudeB, longitudeB } = await getLocationCoordinates(locationA, locationB);

      const addressA = await getAddressFromCoordinates(latitudeA, longitudeA);
      const addressB = await getAddressFromCoordinates(latitudeB, longitudeB);

      const createDamage = await Damage.create({
        name: name,
        sourceName: addressA,
        destinationName: addressB,
        locationA: locationA,
        locationB: locationB,
      });
      if (createDamage) {
        io.emit('newDamageRoad', {
          id: createDamage._id.toString(),
          name: createDamage.name,
          sourceName: createDamage.sourceName,
          destinationName: createDamage.destinationName,
          locationA: createDamage.locationA,
          locationB: createDamage.locationB,
          createdAt: createDamage.createdAt.toISOString(),
          updatedAt: createDamage.updatedAt.toISOString()
        });
        resolve({
          status: "OK",
          data: createDamage,
          message: "Create damage road successfully",
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
        message: "Get LatLong Detection successfully",
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

      const formattedHoles = holes.map((hole) => ({
        ...hole._doc,
        createdAt: moment(hole.createdAt).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss"),
        updatedAt: moment(hole.updatedAt).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss"),
      }));

      resolve({
        total: count,
        data: formattedHoles,
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
      const formattedCracks = cracks.map((crack) => ({
        ...crack._doc,
        createdAt: moment(crack.createdAt).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss"),
        updatedAt: moment(crack.updatedAt).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss"),
      }));
      resolve({
        total: count,
        data: formattedCracks,
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

const getDetailMaintain = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const road = await Road.findById(id);
      resolve({
        data: road,
        status: "OK",
        message: "Get detail road successfully",
      });
    } catch (error) {
      reject(error);
    }
  });
};

const getDetailDamage = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const damage = await Damage.findById(id);
      resolve({
        data: damage,
        status: "OK",
        message: "Get detail damage successfully",
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

      const currentDate = new Date();
      const latLongMaintainRoad = await Road.find({
        endDate: { $gte: currentDate.toISOString().split('T')[0] }
      }).select("locationA");

      const latLongDamageRoad = await Damage.find();

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

      const formatLatLngDamageRoad = (latLngObjects) => {
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

      const formattedLatLongMaintainRoad = formatLatLngMaintainRoad(latLongMaintainRoad);

      const formattedLatLongDamageRoad = formatLatLngDamageRoad(latLongDamageRoad);

      const allKnownCoordinatesHole = [
        ...formattedLatLongLargeHole,
      ];

      const allKnownCoordinatesMaintainRoad = [
        ...formattedLatLongMaintainRoad,
      ];

      const allKnownCoordinatesDamageRoad = [
        ...formattedLatLongDamageRoad,
      ];

      const matchingCoordinatesHole = new Set();
      const matchingCoordinatesMaintainRoad = new Set();
      const matchingCoordinatesDamageRoad = new Set();


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
          if (distance <= 50) {
            matchingCoordinatesMaintainRoad.add(JSON.stringify([knownCoord.latitude, knownCoord.longitude]));
          }
        });
      });

      coordinates.forEach((coord) => {
        allKnownCoordinatesDamageRoad.forEach((knownCoord) => {
          const distance = geolib.getDistance(
            { latitude: coord.latitude, longitude: coord.longitude },
            { latitude: knownCoord.latitude, longitude: knownCoord.longitude }
          );
          if (distance <= 50) {
            matchingCoordinatesDamageRoad.add(JSON.stringify([knownCoord.latitude, knownCoord.longitude]));
          }
        });
      });


      resolve({
        status: "OK",
        matchingCoordinatesHole: Array.from(matchingCoordinatesHole).map(JSON.parse),
        matchingCoordinatesMaintainRoad: Array.from(matchingCoordinatesMaintainRoad).map(JSON.parse),
        matchingCoordinatesDamageRoad: Array.from(matchingCoordinatesDamageRoad).map(JSON.parse),
        message: "Data for tracking response successfully",
      });
    } catch (error) {
      reject(error);
    }
  });
};

const getMaintainRoad = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const count = await Road.countDocuments();
      const roads = await Road.find()
      const formattedMaintains = roads.map((road) => ({
        ...road._doc,
        createdAt: moment(road.createdAt).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss"),
        updatedAt: moment(road.updatedAt).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss"),
      }));
      if (roads) {
        resolve({
          status: "OK",
          total: count,
          data: formattedMaintains,
          message: "Get data maintain road successfully",
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

const getMaintainRoadForMap = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const currentDate = new Date();
      const data = await Road.find({
        endDate: { $gte: currentDate.toISOString().split('T')[0] }
      });
      resolve({
        status: "OK",
        data: data,
        message: "Get data maintain road successfully",
      });
    } catch (error) {
      reject(error);
    }
  });
};

const getDamageRoad = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const count = await Damage.countDocuments();
      const damages = await Damage.find()

      const formattedDamages = damages.map((damage) => ({
        ...damage._doc,
        createdAt: moment(damage.createdAt).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss"),
        updatedAt: moment(damage.updatedAt).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss"),
      }));

      if (damages) {
        resolve({
          status: "OK",
          total: count,
          data: formattedDamages,
          message: "Get data damage road successfully",
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

const getDamageRoadForMap = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const currentDate = new Date();
      const data = await Damage.find({
        endDate: { $gte: currentDate.toISOString().split('T')[0] }
      });

      resolve({
        status: "OK",
        data: data,
        message: "Get data damage road successfully",
      });
    } catch (error) {
      reject(error);
    }
  });
};

const updateHole = (id, data, image) => {
  const io = global.io;
  return new Promise(async (resolve, reject) => {
    try {
      const check = await Hole.findById(id);
      if (!check) {
        reject({
          status: "ERR",
          message: "Hole not found",
        });
      }

      if (image) {
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir);
        }

        const timestamp = Date.now();
        const fileName = `${id}_${timestamp}.jpg`;

        const imagePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(imagePath, image.data);

        const savedImage = await cloudinary.uploader.upload(imagePath, {
          public_id: `hole_${id}_${timestamp}_updated`,
          resource_type: "image"
        });
        fs.unlinkSync(imagePath);
        data.image = savedImage.secure_url;
      }

      await Hole.findByIdAndUpdate(id, data);
      const updatedHole = await Hole.findById(id);
      io.emit('holeUpdated', {
        id: updatedHole._id.toString(),
        name: updatedHole.name,
        location: updatedHole.location,
        address: updatedHole.address,
        description: updatedHole.description,
        image: updatedHole.image,
        createdAt: updatedHole.createdAt.toISOString(),
        updatedAt: updatedHole.updatedAt.toISOString()
      });
      resolve({
        status: "OK",
        message: "Update hole successfully",
      });
    } catch (error) {
      reject(error);
    }
  });
}

const updateCrack = (id, data, image) => {
  const io = global.io;
  return new Promise(async (resolve, reject) => {
    try {
      const check = await Crack.findById(id);
      if (!check) {
        reject({
          status: "ERR",
          message: "Crack not found",
        });
      }

      if (image) {
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir);
        }

        const timestamp = Date.now();
        const fileName = `${id}_${timestamp}.jpg`;

        const imagePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(imagePath, image.data);

        const savedImage = await cloudinary.uploader.upload(imagePath, {
          public_id: `crack_${id}_${timestamp}_updated`,
          resource_type: "image"
        });
        fs.unlinkSync(imagePath);
        data.image = savedImage.secure_url;
      }

      await Crack.findByIdAndUpdate(id, data);
      const updateCrack = await Crack.findById(id);
      io.emit('crackUpdated', {
        id: updateCrack._id,
        location: updateCrack.location,
        address: updateCrack.address,
        description: updateCrack.description,
        image: updateCrack.image || null,
        createdAt: updateCrack.createdAt.toISOString(),
        updatedAt: updateCrack.updatedAt.toISOString()
      });
      resolve({
        status: "OK",
        message: "Update crack successfully",
      });
    } catch (error) {
      reject(error);
    }
  });
}

const updateMaintain = (id, data) => {
  const io = global.io;
  return new Promise(async (resolve, reject) => {
    try {
      const check = await Road.findById(id);
      if (!check) {
        reject({
          status: "ERR",
          message: "Maintain road not found",
        });
      }
      await Road.findByIdAndUpdate(id, data);
      const updatedMaintain = await Road.findById(id);
      io.emit('maintainUpdated', {
        id: updatedMaintain._id.toString(),
        sourceName: updatedMaintain.sourceName,
        destinationName: updatedMaintain.destinationName,
        locationA: updatedMaintain.locationA,
        locationB: updatedMaintain.locationB,
        startDate: updatedMaintain.startDate,
        endDate: updatedMaintain.endDate,
        dateMaintain: updatedMaintain.dateMaintain,
        createdAt: updatedMaintain.createdAt.toISOString(),
        updatedAt: updatedMaintain.updatedAt.toISOString()
      });
      resolve({
        status: "OK",
        message: "Update maintain road successfully",
        data: {
          id: updatedMaintain._id.toString(),
          sourceName: updatedMaintain.sourceName,
          destinationName: updatedMaintain.destinationName,
          locationA: updatedMaintain.locationA,
          locationB: updatedMaintain.locationB,
          startDate: updatedMaintain.startDate,
          endDate: updatedMaintain.endDate,
          dateMaintain: updatedMaintain.dateMaintain,
          createdAt: updatedMaintain.createdAt.toISOString(),
          updatedAt: updatedMaintain.updatedAt.toISOString()
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

const updateDamage = (id, data) => {
  const io = global.io;
  return new Promise(async (resolve, reject) => {
    try {
      const check = await Damage.findById(id);
      if (!check) {
        reject({
          status: "ERR",
          message: "Damage road not found",
        });
      }
      await Damage.findByIdAndUpdate(id, data);
      const updatedDamage = await Damage.findById(id);
      io.emit('damageUpdated', {
        id: updatedDamage._id.toString(),
        name: updatedDamage.name,
        sourceName: updatedDamage.sourceName,
        destinationName: updatedDamage.destinationName,
        locationA: updatedDamage.locationA,
        locationB: updatedDamage.locationB,
        createdAt: updatedDamage.createdAt.toISOString(),
        updatedAt: updatedDamage.updatedAt.toISOString()
      });
      resolve({
        status: "OK",
        message: "Update damage road successfully",
      });
    } catch (error) {
      reject(error);
    }
  });
}

const deleteHole = (id) => {
  const io = global.io;
  return new Promise(async (resolve, reject) => {
    try {
      const check = await Hole.findById(id);
      if (!check) {
        reject({
          status: "ERR",
          message: "Hole not found",
        });
      }
      await Hole.findByIdAndDelete(id);
      io.emit('holeDeleted', { id: id });
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
  const io = global.io;
  return new Promise(async (resolve, reject) => {
    try {
      const check = await Crack.findById(id);
      if (!check) {
        reject({
          status: "ERR",
          message: "Crack not found",
        });
      }
      await Crack.findByIdAndDelete(id);
      io.emit('crackDeleted', { id: id });
      resolve({
        status: "OK",
        message: "Delete crack successfully",
      });
    } catch (error) {
      reject(error);
    }
  });
};

const deleteMaintain = (id) => {
  const io = global.io;
  return new Promise(async (resolve, reject) => {
    try {

      await Road.findByIdAndDelete(id)
      io.emit('maintainDeleted', { id });
      resolve({
        status: "OK",
        message: "Delete maintain road successfully",
      });

    } catch (error) {
      reject(error);
    }
  });
};

const deleteDamage = (id) => {
  const io = global.io;
  return new Promise(async (resolve, reject) => {
    try {

      await Damage.findByIdAndDelete(id)
      io.emit('damageDeleted', { id });
      resolve({
        status: "OK",
        message: "Delete damage road successfully",
      });

    } catch (error) {
      reject(error);
    }
  });
};

const isValidDateString = (str) => {
  if (!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(str)) return false;
  const date = new Date(str);
  return date instanceof Date && !isNaN(date);
};

const getDateRange = (searchTerm) => {
  const startDate = new Date(searchTerm);
  let endDate;
  if (searchTerm.length === 4) {
    // Year only (e.g., "2025")
    endDate = new Date(startDate.getFullYear() + 1, 0, 1);
  } else if (searchTerm.length === 7) {
    // Year and month (e.g., "2025-03")
    endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
  } else {
    // Full date (e.g., "2025-03-10")
    endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1);
  }
  return { startDate, endDate };
};

const searchListDetection = (type, searchTerm) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("searchListDetection", type, searchTerm);
      if (type === 'maintain' && !isNaN(searchTerm) && searchTerm.trim() !== '') {
        const numberValue = parseInt(searchTerm, 10);
        if (!isNaN(numberValue)) {
          const results = await Road.find({ dateMaintain: numberValue });
          return resolve({
            status: 'OK',
            data: results,
            message: 'Search maintain roads by dateMaintain successfully',
          });
        }
      }


      if (!searchTerm || typeof searchTerm !== 'string') {
        return reject({
          status: 'ERR',
          message: 'Search term is required and must be a string',
        });
      }

      let model;
      let searchFields = [];
      let dateFields = [];

      if (type === 'hole') {
        model = Hole;
        searchFields = ['name', 'address', 'location', 'description'];
        dateFields = ['createdAt', 'updatedAt'];
      } else if (type === 'crack') {
        model = Crack;
        searchFields = ['name', 'address', 'location', 'description'];
        dateFields = ['createdAt', 'updatedAt'];
      } else if (type === 'maintain') {
        model = Road;
        searchFields = ['sourceName', 'destinationName'];
        dateFields = ['createdAt', 'updatedAt', 'startDate', 'endDate'];
      } else if (type === 'damage') {
        model = Damage;
        searchFields = ['name', 'sourceName', 'destinationName'];
        dateFields = ['createdAt', 'updatedAt'];
      } else {
        return reject({
          status: 'ERR',
          message: 'Invalid type for search',
        });
      }

      // Build the search query
      const searchQuery = {
        $or: [
          // Text fields search with regex
          ...searchFields.map((field) => ({
            [field]: { $regex: searchTerm, $options: 'i' },
          })),
        ],
      };

      // Only include date fields if searchTerm is a valid date
      if (isValidDateString(searchTerm)) {
        const { startDate, endDate } = getDateRange(searchTerm);
        searchQuery.$or.push(
          ...dateFields.map((field) => ({
            [field]: { $gte: startDate, $lt: endDate },
          })),
        );
      }

      const results = await model.find(searchQuery);
      console.log("results", results);

      if (results.length === 0) {
        return reject({
          status: 'ERR',
          message: `No ${type}s found for the search "${searchTerm}"`,
        });
      } else {
        const formattedResults = results.map((item) => {
          const formattedItem = item._doc;
          dateFields.forEach((field) => {
            if (formattedItem[field]) {
              formattedItem[field] = moment(formattedItem[field]).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss");
            }
          });
          return formattedItem;
        }
        );
        resolve({
          status: 'OK',
          data: formattedResults,
          message: `Search ${type}s successfully`,
        });
      }

    } catch (error) {
      reject({
        status: 'ERR',
        message: error.message || 'An error occurred during search',
      });
    }
  });
};

const getHoleCSV = async () => {
  try {
    // Lấy tất cả dữ liệu từ model Hole
    const holes = await Hole.find(); // Populate để lấy thông tin user (nếu cần)

    // Tạo workbook và worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Holes');

    // Định nghĩa cột trong Excel
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'User', key: 'user', width: 20 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Address', key: 'address', width: 30 },
      { header: 'Image URL', key: 'image', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Updated At', key: 'updatedAt', width: 20 },
    ];

    // Thêm dữ liệu vào worksheet
    holes.forEach(hole => {
      worksheet.addRow({
        name: hole.name,
        user: hole.user, // Lấy username từ user, nếu không có thì hiển thị 'N/A'
        location: hole.location,
        address: hole.address,
        image: hole.image || 'N/A',
        description: hole.description || 'N/A',
        createdAt: hole.createdAt ? hole.createdAt.toISOString() : 'N/A',
        updatedAt: hole.updatedAt ? hole.updatedAt.toISOString() : 'N/A',
      });
    });

    // Định dạng tiêu đề (header) của bảng
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Tạo file Excel
    const fileName = `Holes_Export_${Date.now()}.xlsx`;
    await workbook.xlsx.writeFile(fileName);

    return fileName; // Trả về tên file để có thể sử dụng (ví dụ: gửi file cho client)
  } catch (error) {
    console.error('Error exporting holes to_excel:', error);
    throw error;
  }
};

const getCrackCSV = async () => {
  try {
    // Lấy tất cả dữ liệu từ model Hole
    const cracks = await Crack.find(); // Populate để lấy thông tin user (nếu cần)

    // Tạo workbook và worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cracks');

    // Định nghĩa cột trong Excel
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'User', key: 'user', width: 20 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Address', key: 'address', width: 30 },
      { header: 'Image URL', key: 'image', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Updated At', key: 'updatedAt', width: 20 },
    ];

    // Thêm dữ liệu vào worksheet
    cracks.forEach(crack => {
      worksheet.addRow({
        name: crack.name,
        user: crack.user, // Lấy username từ user, nếu không có thì hiển thị 'N/A'
        location: crack.location,
        address: crack.address,
        image: crack.image || 'N/A',
        description: crack.description || 'N/A',
        createdAt: crack.createdAt ? crack.createdAt.toISOString() : 'N/A',
        updatedAt: crack.updatedAt ? crack.updatedAt.toISOString() : 'N/A',
      });
    });

    // Định dạng tiêu đề (header) của bảng
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Tạo file Excel
    const fileName = `Cracks_Export_${Date.now()}.xlsx`;
    await workbook.xlsx.writeFile(fileName);

    return fileName; // Trả về tên file để có thể sử dụng (ví dụ: gửi file cho client)
  } catch (error) {
    console.error('Error exporting cracks to_excel:', error);
    throw error;
  }
};

const getMaintainCSV = async () => {
  try {
    // Lấy tất cả dữ liệu từ model Road
    const roads = await Road.find();

    // Tạo workbook và worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Maintains');

    // Định nghĩa cột trong Excel
    worksheet.columns = [
      { header: 'Source Name', key: 'sourceName', width: 20 },
      { header: 'Destination Name', key: 'destinationName', width: 20 },
      { header: 'Location A', key: 'locationA', width: 20 },
      { header: 'Location B', key: 'locationB', width: 20 },
      { header: 'Start Date', key: 'startDate', width: 15 },
      { header: 'End Date', key: 'endDate', width: 15 },
      { header: 'Date Maintain', key: 'dateMaintain', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Updated At', key: 'updatedAt', width: 20 },
    ];

    // Thêm dữ liệu vào worksheet
    roads.forEach(road => {
      worksheet.addRow({
        sourceName: road.sourceName,
        destinationName: road.destinationName,
        locationA: road.locationA,
        locationB: road.locationB,
        startDate: road.startDate,
        endDate: road.endDate,
        dateMaintain: road.dateMaintain,
        createdAt: road.createdAt ? road.createdAt.toISOString() : 'N/A',
        updatedAt: road.updatedAt ? road.updatedAt.toISOString() : 'N/A',
      });
    });

    // Định dạng tiêu đề (header) của bảng
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Tạo file Excel
    const fileName = `Maintains_Export_${Date.now()}.xlsx`;
    await workbook.xlsx.writeFile(fileName);

    return fileName; // Trả về tên file để sử dụng (ví dụ: gửi file cho client)
  } catch (error) {
    console.error('Error exporting roads to Excel:', error);
    throw error;
  }
};

const getDamageCSV = async () => {
  try {
    // Lấy tất cả dữ liệu từ model Damage
    const damages = await Damage.find();

    // Tạo workbook và worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Damages');

    // Định nghĩa cột trong Excel
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Source Name', key: 'sourceName', width: 20 },
      { header: 'Destination Name', key: 'destinationName', width: 20 },
      { header: 'Location A', key: 'locationA', width: 20 },
      { header: 'Location B', key: 'locationB', width: 20 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Updated At', key: 'updatedAt', width: 20 },
    ];

    // Thêm dữ liệu vào worksheet
    damages.forEach(damage => {
      worksheet.addRow({
        name: damage.name,
        sourceName: damage.sourceName,
        destinationName: damage.destinationName,
        locationA: damage.locationA,
        locationB: damage.locationB,
        createdAt: damage.createdAt ? damage.createdAt.toISOString() : 'N/A',
        updatedAt: damage.updatedAt ? damage.updatedAt.toISOString() : 'N/A',
      });
    });

    // Định dạng tiêu đề (header) của bảng
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Tạo file Excel
    const fileName = `Damages_Export_${Date.now()}.xlsx`;
    await workbook.xlsx.writeFile(fileName);

    return fileName; // Trả về tên file để sử dụng (ví dụ: gửi file cho client)
  } catch (error) {
    console.error('Error exporting damages to Excel:', error);
    throw error;
  }
};

const getReportDetection = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const now = new Date();
      const timeZone = 'Asia/Ho_Chi_Minh';

      const today = now.toLocaleString('vi-VN', { timeZone });
      // Ngày đầu tháng hiện tại
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      // Ngày đầu tháng (vd: 2025-06-01T00:00:00.000Z)
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);

      // Bộ lọc thời gian cho timestamp
      const timeFilter = {
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfToday
        }
      };

      // Đếm trong tháng
      const crackCount = await Crack.countDocuments(timeFilter);
      const holeCount = await Hole.countDocuments(timeFilter);
      const damageCount = await Damage.countDocuments(timeFilter);

      // Lọc bảo trì có thời gian giao với tháng hiện tại
      const maintainList = await Road.find({
        $or: [
          { startDate: { $gte: startOfMonth.toISOString().split('T')[0], $lte: endOfToday.toISOString().split('T')[0] } },
          { endDate: { $gte: startOfMonth.toISOString().split('T')[0], $lte: endOfToday.toISOString().split('T')[0] } }
        ]
      });

      resolve({
        status: "OK",
        dateFirstMonth: firstDayOfMonth.toISOString().split('T')[0],
        dateToday: today,
        crackCount,
        holeCount,
        damageCount,
        maintainCount: maintainList.length,
        maintainList,
        moreInfo: 'http://saferoad.duckdns.org:3003/home/map'
      });
    } catch (error) {
      reject({
        status: 'ERR',
        message: error.message || 'An error occurred during search',
      });
    }
  });
}

const getSortedData = (type, sortBy) => {
  return new Promise(async (resolve, reject) => {
    try {
      let model;
      switch (type) {
        case 'crack':
          model = Crack;
          break;
        case 'hole':
          model = Hole;
          break;
        case 'damage':
          model = Damage;
          break;
        case 'road':
          model = Road;
          break;
        default:
          return reject({
            status: 'ERR',
            message: 'Invalid model type. Use "crack", "hole", "damage", or "road".'
          });
      }

      let data;
      if (type === 'road') {
        let sortOptions = {};

        switch (sortBy) {
          case 'newest':
            sortOptions = { createdAt: -1 };
            data = await Road.find().sort(sortOptions);
            break;
          case 'oldest':
            sortOptions = { createdAt: 1 };
            data = await Road.find().sort(sortOptions);
            break;
          case 'maintain_asc':
            sortOptions = { dateMaintain: 1 };
            data = await Road.find().sort(sortOptions);
            break;
          case 'maintain_desc':
            sortOptions = { dateMaintain: -1 };
            data = await Road.find().sort(sortOptions);
            break;
          case 'distance_asc':
          case 'distance_desc':
            data = await Road.find();
            data = data.sort((a, b) => {
              const distanceA = calculateDistance(a.locationA, a.locationB);
              const distanceB = calculateDistance(b.locationA, b.locationB);
              return sortBy === 'distance_asc' ? distanceA - distanceB : distanceB - distanceA;
            });
            break;
          default:
            return reject({
              status: 'ERR',
              message: `Invalid sort option for road. Valid options: newest, oldest, maintain_asc, maintain_desc, distance_asc, distance_desc.`
            });
        }
      } else {
        // Xử lý cho crack, hole, damage
        const sortOrder = sortBy === 'newest' ? -1 : 1;
        data = await model.find().sort({ createdAt: sortOrder });
      }

      resolve({
        status: 'OK',
        data,
        message: `Successfully retrieved sorted ${type} data`
      });
    } catch (error) {
      reject({
        status: 'ERR',
        message: error.message || 'An error occurred while fetching sorted data'
      });
    }
  });
};

const getMonthlyStatistics = async (year) => {
  // Tạo điều kiện lọc theo năm nếu có
  const matchYear = year ? {
    $match: {
      createdAt: {
        $gte: new Date(`${year}-01-01T00:00:00Z`),
        $lte: new Date(`${year}-12-31T23:59:59Z`)
      }
    }
  } : { $match: {} }; // Nếu không có năm, lấy tất cả

  // Aggregation pipeline cho mỗi model
  const aggregateByMonth = (model) => [
    matchYear,
    {
      $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 } // Sắp xếp theo tháng tăng dần
    },
    {
      $project: {
        month: '$_id',
        count: 1,
        _id: 0
      }
    }
  ];

  // Thực hiện aggregation cho từng model
  const [crackStats, holeStats, roadStats, damageStats] = await Promise.all([
    Crack.aggregate(aggregateByMonth(Crack)),
    Hole.aggregate(aggregateByMonth(Hole)),
    Road.aggregate(aggregateByMonth(Road)),
    Damage.aggregate(aggregateByMonth(Damage))
  ]);

  // Tạo mảng kết quả với 12 tháng
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    cracks: 0,
    holes: 0,
    roads: 0,
    damages: 0
  }));

  // Gán số liệu vào các tháng tương ứng
  crackStats.forEach(stat => {
    months[stat.month - 1].cracks = stat.count;
  });
  holeStats.forEach(stat => {
    months[stat.month - 1].holes = stat.count;
  });
  roadStats.forEach(stat => {
    months[stat.month - 1].roads = stat.count;
  });
  damageStats.forEach(stat => {
    months[stat.month - 1].damages = stat.count;
  });

  return months;
};

module.exports = {
  createDetection,
  createDetectionForJetson,
  createMaintainRoad,
  createDamageRoad,

  getLatLongDetection,
  getListHoles,
  getListCracks,
  getDetailHole,
  getDetailCrack,
  getDetailMaintain,
  getDetailDamage,
  getListForTracking,
  getMaintainRoad,
  getMaintainRoadForMap,
  getDamageRoad,
  getDamageRoadForMap,

  getHoleCSV,
  getCrackCSV,
  getMaintainCSV,
  getDamageCSV,

  updateHole,
  updateCrack,
  updateMaintain,
  updateDamage,

  deleteHole,
  deleteCrack,
  deleteMaintain,
  deleteDamage,

  searchListDetection,
  getSortedData,
  getReportDetection,
  getMonthlyStatistics,

  checkCoordinates,

};
