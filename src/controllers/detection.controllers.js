const DetectionServices = require('../services/detection.services')

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

const createMaintainRoad = async (req, res) => {
    try {
        const {locationA, locationB, date} = req.body;
        const response = await DetectionServices.createMaintainRoad(locationA, locationB, date )
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

const getMap = async (req,res) =>{
    try{
        const hole = await DetectionServices.getListHoles()

        const crack = await DetectionServices.getListCracks()

        const maintain = await DetectionServices.getMaintainRoad()

        return res.render('map.ejs',{
            googleMapsApiKey: process.env.API_GOOGLE_KEY,
            holesUrl: `${process.env.URL_VPS}/api/detection/get-list-holes`,
            cracksUrl: `${process.env.URL_VPS}/api/detection/get-list-crack`,
            maintainRoadUrl: `${process.env.URL_VPS}/api/detection/get-maintain-road`,
            totalHole: hole.total,
            totalCrack: crack.total,
            totalMaintain: maintain.total
            }    
            );
    }catch(e){
        return res.status(404).json({
            message: e
        })
    }
}

module.exports = {
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
    deleteMaintain,
    getMap
}