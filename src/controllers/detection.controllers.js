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

module.exports = {
    getLatLongDetection,
    getListHoles,
    getListCracks,
    getDetailHole,
    getDetailCrack,
    getListForTracking
}