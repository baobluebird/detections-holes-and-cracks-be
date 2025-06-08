const DetectionServices = require('../services/detection.services')
const fs = require('fs').promises;
const axios = require('axios');
const path = require('path');
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

const createDetection = async (req, res) => {

  try {
    const image = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    };
    const { typeDetection, location, userId } = req.body;
    const { latitude, longitude } = getLocationCoordinates(location);
    const address = await getAddressFromCoordinates(latitude, longitude);

    if (!typeDetection || !location || !image || !userId || !address) {
      return res.status(200).json({
        status: "ERR",
        message: "The input is required",
      });
    }

    const response = await DetectionServices.createDetection(
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
};

const createDetectionForJetson = async (req, res) => {
  try {
    const image = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    };
    const { typeDetection, location, userId, description } = req.body;
    const { latitude, longitude } = getLocationCoordinates(location);
    const address = await getAddressFromCoordinates(latitude, longitude);

    if (!typeDetection || !location || !image || !userId || !address || !description) {
      return res.status(200).json({
        status: "ERR",
        message: "The input is required",
      });
    }

    const response = await DetectionServices.createDetectionForJetson(
      typeDetection,
      location,
      image,
      userId,
      address,
      description
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

const getLatLongDetection = async (req, res)  =>  {
    try {
        const response = await DetectionServices.getLatLongDetection()
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const getListHoles = async (req, res) => {
    try {
        const response = await DetectionServices.getListHoles()
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const getListCracks = async (req, res) => {
    try {
        const response = await DetectionServices.getListCracks()
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const getDetailHole = async (req, res) => {
    try {
        const response = await DetectionServices.getDetailHole(req.params.id)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const getDetailCrack = async (req, res) => {
    try {
        const response = await DetectionServices.getDetailCrack(req.params.id)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const getDetailMaintain = async (req, res) => {
    try {
        const response = await DetectionServices.getDetailMaintain(req.params.id)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const getDetailDamage = async (req, res) => {
    try {
        const response = await DetectionServices.getDetailDamage(req.params.id)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const getListForTracking = async (req, res) => {
    try {
        const { coordinates } = req.body;
        const response = await DetectionServices.getListForTracking(coordinates)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const updateHole = async (req, res) => {
  try {
    const image = req.file
      ? {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        }
      : null;

    const { location, address, description } = req.body;
    const data = { location, address, description };
    console.log(req.body);
    const response = await DetectionServices.updateHole(req.params.id, data, image);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e.message || e,
    });
  }
};

const updateCrack = async (req, res) => {
  try {
    const image = req.file
      ? {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        }
      : null;
    const { location, address, description } = req.body;
    const data = { location, address, description };
    console.log(req.body);
    const response = await DetectionServices.updateCrack(req.params.id, data, image);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e.message || e,
    });
  }
};


const updateMaintain = async (req, res) => {
    try {
        const { sourceName, destinationName, locationA, locationB, startDate, endDate } = req.body;

        const data = { sourceName, destinationName, locationA, locationB, startDate, endDate };
        const response = await DetectionServices.updateMaintain(req.params.id, data);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e.message || e,
        });
    }
}

const updateDamage = async (req, res) => {
    try {
        const { name, sourceName, destinationName, locationA, locationB} = req.body;
        const data = { name, sourceName, destinationName, locationA, locationB};
        const response = await DetectionServices.updateDamage(req.params.id, data);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e.message || e,
        });
    }
}

const deleteHole = async (req, res) => {
    try {
        const response = await DetectionServices.deleteHole(req.params.id)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const deleteCrack = async (req, res) => {
    try {
        const response = await DetectionServices.deleteCrack(req.params.id)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const deleteMaintain = async (req, res) => {
    try {
        const response = await DetectionServices.deleteMaintain(req.params.id)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const deleteDamage = async (req, res) => {
    try {
        const response = await DetectionServices.deleteDamage(req.params.id)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const createMaintainRoad = async (req, res) => {
    try {
        const {locationA, locationB, startDate, endDate, totalDays} = req.body;
        console.log(req.body)
        const response = await DetectionServices.createMaintainRoad(locationA, locationB, startDate, endDate, totalDays)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const createDamageRoad = async (req, res) => {
    try {
        const {name, locationA, locationB} = req.body;

        const response = await DetectionServices.createDamageRoad(name, locationA, locationB)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const getMaintainRoad = async (req, res) => {
    try {
        const response = await DetectionServices.getMaintainRoad()
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const getDamageRoad = async (req, res) => {
    try {
        const response = await DetectionServices.getDamageRoad()
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const getMaintainRoadForMap = async (req, res) => {
    try {
        const response = await DetectionServices.getMaintainRoadForMap()
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const getDamageRoadForMap = async (req, res) => {
    try {
        const response = await DetectionServices.getDamageRoadForMap()
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}



const getMap = async (req,res) =>{
    try{
        const hole = await DetectionServices.getListHoles()

        const crack = await DetectionServices.getListCracks()

        const maintain = await DetectionServices.getMaintainRoad()

        const damage = await DetectionServices.getDamageRoad()

        return res.render('map.ejs',{
            googleMapsApiKey: process.env.API_GOOGLE_KEY,
            holesUrl: `${process.env.URL_VPS}/api/detection/get-list-holes`,
            cracksUrl: `${process.env.URL_VPS}/api/detection/get-list-crack`,
            maintainRoadUrl: `${process.env.URL_VPS}/api/detection/get-maintain-road`,
            damageRoadUrl: `${process.env.URL_VPS}/api/detection/get-damage-road`,
            totalHole: hole.total,
            totalCrack: crack.total,
            totalMaintain: maintain.total,
            totalDamage: damage.total
        } );
    }catch(e){
        return res.status(404).json({
            message: e
        })
    }
}

const getMapForPublic = async (req,res) =>{
    try{
        const hole = await DetectionServices.getListHoles()

        const crack = await DetectionServices.getListCracks()

        const maintain = await DetectionServices.getMaintainRoad()

        const damage = await DetectionServices.getDamageRoad()

        return res.render('map_for_public.ejs',{
            googleMapsApiKey: process.env.API_GOOGLE_KEY,
            holesUrl: `${process.env.URL_VPS}/api/detection/get-list-holes`,
            cracksUrl: `${process.env.URL_VPS}/api/detection/get-list-crack`,
            maintainRoadUrl: `${process.env.URL_VPS}/api/detection/get-maintain-road`,
            damageRoadUrl: `${process.env.URL_VPS}/api/detection/get-damage-road`,
            totalHole: hole.total,
            totalCrack: crack.total,
            totalMaintain: maintain.total,
            totalDamage: damage.total
        } );
    }catch(e){
        return res.status(404).json({
            message: e
        })
    }
}

const getHomeHolesData = async (req, res) => {
    try {
        const listHole = await DetectionServices.getListHoles();
        return res.render('homeDataHole.ejs', {
            googleMapsApiKey: process.env.API_GOOGLE_KEY,
            listHole: listHole.data,
            totalHole: listHole.total
        });
    } catch (e) {
        return res.status(404).json({
            message: e.message || 'Error fetching holes data',
        });
    }
};

const getHomeCracksData = async (req, res) => {
    try {
        const listCrack = await DetectionServices.getListCracks();
        return res.render('homeDataCrack.ejs', {
            googleMapsApiKey: process.env.API_GOOGLE_KEY,
            listCrack: listCrack.data,
            totalCrack: listCrack.total
        });
    } catch (e) {
        return res.status(404).json({
            message: e.message || 'Error fetching cracks data',
        });
    }
};
const getHomeMaintainData = async (req, res) => {
    try {
        const listMaintain = await DetectionServices.getMaintainRoad();
        return res.render('homeDataMaintainRoad.ejs', {
            googleMapsApiKey: process.env.API_GOOGLE_KEY,
            listMaintain: listMaintain.data,
            totalMaintain: listMaintain.total
        });
    } catch (e) {
        return res.status(404).json({
            message: e.message || 'Error fetching maintain data',
        });
    }
};

const getHomeDamageData = async (req, res) => {
    try {
        const listDamage = await DetectionServices.getDamageRoad();
        return res.render('homeDataDamage.ejs', {
            googleMapsApiKey: process.env.API_GOOGLE_KEY,
            listDamage: listDamage.data,
            totalDamage: listDamage.total
        });
    } catch (e) {
        return res.status(404).json({
            message: e.message || 'Error fetching damage data',
        });
    }
};

const getSearch = async (req, res) => {
    try {
        return res.render('homeSearch.ejs', {
            googleMapsApiKey: process.env.API_GOOGLE_KEY,
        });
    } catch (e) {
        return res.status(404).json({
            message: e.message || 'Error fetching damage data',
        });
    }
};

const searchListDetection = async (req, res) => {
    try {
        const { type, term } = req.query;
        if (!type || !term) {
            return res.status(400).json({
                status: "ERR",
                message: "Type and search query parameters are required",
            });
        }
        const response = await DetectionServices.searchListDetection(type, term);
        return res.status(200).json(response);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
}

const getHome = async (req, res) => {
    try {
        return res.render('home.ejs', {
        });
    } catch (e) {
        return res.status(404).json({
            message: e.message || 'Error fetching damage data',
        });
    }
};




const getHoleCSV = async (req, res) => {
    try {
        const filePath = await DetectionServices.getHoleCSV();
        const fileName = path.basename(filePath);
        console.log('File path:', filePath);
        console.log('File name:', fileName);
        res.download(filePath, fileName, async (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).json({ message: 'Error downloading file', error: err.message });
            }

            try {
                await fs.unlink(filePath);
                console.log(`File ${fileName} deleted from server.`);
            } catch (deleteError) {
                console.error('Error deleting file from server:', deleteError);
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || 'Error exporting holes to CSV',
        });
    }
};

const getCrackCSV = async (req, res) => {
    try {
        const filePath = await DetectionServices.getCrackCSV();
        const fileName = path.basename(filePath);

        // Gửi file cho client
        res.download(filePath, fileName, async (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).json({ message: 'Error downloading file', error: err.message });
            }

            // Xóa file sau khi gửi (dù thành công hay thất bại)
            try {
                await fs.unlink(filePath);
                console.log(`File ${fileName} deleted from server.`);
            } catch (deleteError) {
                console.error('Error deleting file from server:', deleteError);
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || 'Error exporting cracks to CSV',
        });
    }
};

const getMaintainCSV = async (req, res) => {
    try {
        const filePath = await DetectionServices.getMaintainCSV();
        const fileName = path.basename(filePath);

        res.download(filePath, fileName, async (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).json({ message: 'Error downloading file', error: err.message });
            }

            try {
                await fs.unlink(filePath);
                console.log(`File ${fileName} deleted from server.`);
            } catch (deleteError) {
                console.error('Error deleting file from server:', deleteError);
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || 'Error exporting maintains to CSV',
        });
    }
};

const getDamageCSV = async (req, res) => {
    try {
        const filePath = await DetectionServices.getDamageCSV();
        const fileName = path.basename(filePath);

        res.download(filePath, fileName, async (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).json({ message: 'Error downloading file', error: err.message });
            }

            try {
                await fs.unlink(filePath);
                console.log(`File ${fileName} deleted from server.`);
            } catch (deleteError) {
                console.error('Error deleting file from server:', deleteError);
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || 'Error exporting damages to CSV',
        });
    }
};

module.exports = {
    createDetection,
    createDetectionForJetson,
    createMaintainRoad,
    createDamageRoad,

    getLatLongDetection,
    getListHoles,
    getListCracks,
    getListForTracking,
    getMaintainRoad,
    getMaintainRoadForMap,
    getDamageRoad,
    getDamageRoadForMap,
    getHomeMaintainData,

    getHomeHolesData,
    getHomeCracksData,
    getHomeDamageData,
    getHome,
    getMap,
    getMapForPublic,
    getSearch,


    getDetailHole,
    getDetailCrack,
    getDetailMaintain,
    getDetailDamage,

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
    
}