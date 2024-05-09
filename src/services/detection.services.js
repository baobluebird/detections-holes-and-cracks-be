const Hole = require("../models/hole.model");
const Crack = require("../models/crack.model");

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
      console.log("image", image.data);
      console.log("address", address);
      console.log("typeDetection", typeDetection);
      if (typeDetection == "Ổ gà") {
        const hole = await Hole.create({
          name: "Ổ gà",
          user: userId,
          location: location,
          address: address,
          image: image,
          description: description,
        });
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
          image: image,
          description: description,
        });
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
        //find hole with description = 'Small', description = 'Large'
        //find crack with description = 'Small', description = 'Large'   
        const latLongSmallHole = await Hole.find({ description: { $in: ['Small'] } }).select('location');
        const latLongLargeHole = await Hole.find({ description: { $in: [ 'Large'] } }).select('location');
        const latLongSmallCrack = await Crack.find({ description: { $in: ['Small'] } }).select('location');
        const latLongLargeCrack = await Crack.find({ description: { $in: ['Large'] } }).select('location');
      // Chuyển đổi đối tượng thành mảng các cặp tọa độ [latitude, longitude]
      const formatLatLng = (latLngObjects) => {
        return latLngObjects.map(obj => {
          const matches = obj.location.match(/LatLng\(latitude:(.*), longitude:(.*)\)/);
          if (matches && matches.length === 3) {
            return [parseFloat(matches[1]), parseFloat(matches[2])];
          } else {
            return null; // Nếu không phù hợp, trả về null hoặc giá trị khác để xử lý sau này
          }
        }).filter(Boolean); // Loại bỏ các giá trị null (nếu có)
      };
      const formattedLatLongSmallHole = formatLatLng(latLongSmallHole);
      const formattedLatLongLargeHole = formatLatLng(latLongLargeHole);
      const formattedLatLongSmallCrack = formatLatLng(latLongSmallCrack);
      const formattedLatLongLargeCrack = formatLatLng(latLongLargeCrack);

      console.log('formattedLatLongSmallHole', formattedLatLongSmallHole);     
      console.log('formattedLatLongLargeHole', formattedLatLongLargeHole);  
      console.log('formattedLatLongSmallCrack', formattedLatLongSmallCrack);  
      console.log('formattedLatLongLargeCrack', formattedLatLongLargeCrack);  

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
      const holes = await Hole.find().select('-image');
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
      const cracks = await Crack.find().select('-image');
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
            image: hole.image.data,
            data: hole,
            status: "OK",
            message: "Get detail hole successfully",
        });
    } catch (error) {
        reject(error);
        }
    })
}

const getDetailCrack = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
        const crack = await Crack.findById(id);
        resolve({
            image: crack.image.data,
            data: crack,
            status: "OK",
            message: "Get detail crack successfully",
        });
        }
        catch (error) {
            reject(error);
        }
    })
}

module.exports = {
  createDetection,
  getLatLongDetection,
  getListHoles,
  getListCracks,
  getDetailHole,
  getDetailCrack
}
