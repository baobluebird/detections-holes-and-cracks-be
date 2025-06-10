const express = require('express');
const router = express.Router();
//src\controllers\user.controllers.js
const userController = require('../../controllers/user.controllers');
const {  authUserMiddleware  } = require('../../middleware/authMiddleware');

router.post('/sign-up', userController.createUser);
router.post('/signup-google', userController.createUserWithGoogle);
router.post('/signup-google-for-web', userController.createUserWithGoogleForWeb);
router.post('/sign-in', userController.loginUser);
router.post('/signin-google', userController.loginUserWithGoogle);
router.post('/signin-google-for-web', userController.loginUserWithGoogleForWeb);
router.post('/log-out', userController.logoutUser);

router.post('/update-user/:id', authUserMiddleware, userController.updateUser);
router.get('/get-detail/:id', authUserMiddleware ,userController.getDetailsUser);
router.post('/change-password/:id', userController.changePassword);
router.post('/create-token', userController.refreshToken);
router.post('/send-token', userController.decodeToken)
router.post('/send-help/:id', userController.sendHelp)


module.exports = router;  