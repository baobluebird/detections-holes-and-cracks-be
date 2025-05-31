const Hole = require("../models/hole.model");
const Crack = require("../models/crack.model");
const Road = require("../models/road.model");
const Damage = require("../models/damage.model");
const dotenv = require("dotenv");
const axios = require('axios');
const moment = require("moment-timezone");

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
        console.log(hole)
        io.emit("newDataAdded", hole);
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
        io.emit("newDataAdded", crack);
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
      const { latitudeA, longitudeA, latitudeB, longitudeB} = await getLocationCoordinates(locationA, locationB);

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

      if(createMaintain)    {
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

      const { latitudeA, longitudeA, latitudeB, longitudeB} = await getLocationCoordinates(locationA, locationB);

      const addressA = await getAddressFromCoordinates(latitudeA, longitudeA);
      const addressB = await getAddressFromCoordinates(latitudeB, longitudeB);
 
      const createDamage = await Damage.create({
        name: name,
        sourceName: addressA,
        destinationName: addressB,
        locationA: locationA,
        locationB: locationB,
      }); 
      if(createDamage)    {
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

      const formattedLatLongMaintainRoad= formatLatLngMaintainRoad(latLongMaintainRoad);

      const formattedLatLongDamageRoad= formatLatLngDamageRoad(latLongDamageRoad);
      
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

const getMaintainRoad =  () => {
  return new Promise(async (resolve, reject) => {
    try {
      const count = await Road.countDocuments();
      const data = await Road.find()
      if(data)    {
        resolve({
          status: "OK",
          total: count,
          data: data,
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

const getDamageRoad =  () => {
  return new Promise(async (resolve, reject) => {
    try {
      const count = await Damage.countDocuments();
      const data = await Damage.find()
      if(data)    {
        resolve({
          status: "OK",
          total: count,
          data: data,
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
      if(!check){
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
      if(!check){
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
      if(!check){
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
      });
    } catch (error) {
      reject(error);
    }
  });
}

const updateDamage = (id, data) => {
  const io = global.io;
  return new Promise(async (resolve, reject) => {
    try {
      const check = await Damage.findById(id);
      if(!check){
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
      if(!check){
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
      if(!check){
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

const deleteMaintain =  (id) => {
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

const deleteDamage =  (id) => {
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

      resolve({
        status: 'OK',
        data: results,
        message: `Search ${type}s successfully`,
      });
    } catch (error) {
      reject({
        status: 'ERR',
        message: error.message || 'An error occurred during search',
      });
    }
  });
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

  updateHole,
  updateCrack,
  updateMaintain,
  updateDamage,

  deleteHole,
  deleteCrack,
  deleteMaintain,
  deleteDamage,

  searchListDetection,

};
