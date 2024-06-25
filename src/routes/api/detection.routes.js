const express = require('express');
const router = express.Router();
const detectionController = require('../../controllers/detection.controllers');
const {  authUserMiddleware  } = require('../../middleware/authMiddleware');

router.get('/get-detection', detectionController.getLatLongDetection);

router.get('/get-detail-hole/:id', detectionController.getDetailHole);
router.get('/get-detail-crack/:id', detectionController.getDetailCrack);

router.get('/get-list-holes', detectionController.getListHoles);
router.get('/get-list-crack', detectionController.getListCracks);

router.delete('/delete-hole/:id', detectionController.deleteHole);
router.delete('/delete-crack/:id', detectionController.deleteCrack);


router.post('/post-location-tracking', detectionController.getListForTracking)
module.exports = router;  