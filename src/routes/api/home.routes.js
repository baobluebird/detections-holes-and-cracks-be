const express = require('express');
const router = express.Router();
//src\controllers\user.controllers.js
const userController = require('../../controllers/user.controllers');
const codeController = require('../../controllers/code.controllers');
const {  authUserMiddleware  } = require('../../middleware/authMiddleware');
const authMiddleware = require('../../middleware/authMiddleware').authMiddleware;
const detectionController = require('../../controllers/detection.controllers');

router.get('/',detectionController.getHome);

router.get('/data-send-help',userController.getDataSendHelp);
router.get('/map',detectionController.getMap);
router.get('/map-for-public',detectionController.getMapForPublic);
router.get('/search',detectionController.getSearch);
router.get('/login',userController.getLogin);
router.get('/logout',userController.getLogout);
router.get('/forgot-password',codeController.getForgotPassword);
router.get('/verify-code/:id',codeController.getVerifyCode);
router.get('/reset-password/:id',codeController.getResetPassword);

router.get('/data-hole',detectionController.getHomeHolesData);
router.get('/data-crack',detectionController.getHomeCracksData);
router.get('/data-maintain',detectionController.getHomeMaintainData);
router.get('/data-damage',detectionController.getHomeDamageData);

module.exports = router;  