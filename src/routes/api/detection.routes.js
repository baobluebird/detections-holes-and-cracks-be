const express = require('express');
const router = express.Router();
const detectionController = require('../../controllers/detection.controllers');
const {  authUserMiddleware  } = require('../../middleware/authMiddleware');

router.get('/get-detection', detectionController.getLatLongDetection);

router.get('/get-detail-hole/:id', detectionController.getDetailHole);
router.get('/get-detail-crack/:id', detectionController.getDetailCrack);

router.get('/get-list-holes', detectionController.getListHoles);
router.get('/get-list-crack', detectionController.getListCracks);


module.exports = router;  