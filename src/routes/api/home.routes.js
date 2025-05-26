const express = require('express');
const router = express.Router();
//src\controllers\user.controllers.js
const userController = require('../../controllers/user.controllers');
const {  authUserMiddleware  } = require('../../middleware/authMiddleware');
const detectionController = require('../../controllers/detection.controllers');

router.get('/data-send-help', userController.getDataSendHelp);
router.get('/map', detectionController.getMap);

router.get('/data-hole', detectionController.getHomeHolesData);
router.get('/data-crack', detectionController.getHomeCracksData);
router.get('/data-maintain', detectionController.getHomeMaintainData);


module.exports = router;  