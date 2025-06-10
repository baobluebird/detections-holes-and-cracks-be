const express = require('express');
const router = express.Router();
const detectionController = require('../../controllers/detection.controllers');
const { authMiddleware } = require('../../middleware/authMiddleware');

module.exports = (upload) => {
  router.get('/get-detection', detectionController.getLatLongDetection);
  router.get('/get-detail-hole/:id', detectionController.getDetailHole);
  router.get('/get-detail-crack/:id', detectionController.getDetailCrack);
  router.get('/get-detail-maintain/:id', detectionController.getDetailMaintain);
  router.get('/get-detail-damage/:id', detectionController.getDetailDamage);


  router.get('/get-list-holes', detectionController.getListHoles);
  router.get('/get-list-crack', detectionController.getListCracks);

  router.post('/update-hole/:id', upload.single('image'), detectionController.updateHole);
  router.post('/update-crack/:id', upload.single('image'), detectionController.updateCrack);
  router.post('/update-maintain/:id', detectionController.updateMaintain);
  router.post('/update-damage/:id', detectionController.updateDamage);

  router.delete('/delete-hole/:id', detectionController.deleteHole);
  router.delete('/delete-crack/:id', detectionController.deleteCrack);
  router.delete('/delete-maintain/:id', detectionController.deleteMaintain);
  router.delete('/delete-damage/:id', detectionController.deleteDamage);

  router.get('/get-hole-csv', detectionController.getHoleCSV);
  router.get('/get-crack-csv', detectionController.getCrackCSV);
  router.get('/get-maintain-csv', detectionController.getMaintainCSV);
  router.get('/get-damage-csv', detectionController.getDamageCSV);

  router.get('/get-maintain-road', detectionController.getMaintainRoad);
  router.get('/get-maintain-road-for-map', detectionController.getMaintainRoadForMap);
  
  router.get('/get-damage-road', detectionController.getDamageRoad);

  router.post('/post-location-tracking', detectionController.getListForTracking);

  router.post('/create', upload.single('image'), detectionController.createDetection);
  router.post('/create-for-jetson', upload.single('image'), detectionController.createDetectionForJetson);
  router.post('/create-maintain-road', detectionController.createMaintainRoad);
  router.post('/create-damage-road', detectionController.createDamageRoad);

  router.get('/search-list-detection',detectionController.searchListDetection);

  router.get('/get-report-detection', authMiddleware, detectionController.getReportDetection);

  return router;
};