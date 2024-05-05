const express = require('express');
const router = express.Router();
const userController = require('../../controllers/UserController');
const {  authUserMiddleware  } = require('../../middleware/authMiddleware');


//router.post('/sign-up', userController.createUser);
router.post('/sign-in', userController.loginUser);
router.post('/log-out', userController.logoutUser)
router.post('/forgot-password', userController.resetPassword)
router.post('/verify-code', userController.verifyCode)
router.post('/send-token', userController.decodeToken)
router.get('/get-image/:id', userController.getImage);

//router.post('/update-user/:id', userController.updateUser);
router.post('/update-pass/:id', userController.updatePass);
router.get('/get-detail/:id',authUserMiddleware ,userController.getDetailsUser);
router.post('/send-money/:id', userController.sendMoney);
router.post('/get-total-money/:id', userController.getTotalMoney);
router.post('/get-log-money-send/:id', userController.getLogMoneySend);
router.post('/create-goal/:id', userController.createGoal);
router.get('/get-list-name-goal/:id', userController.getListNameGoal);
router.post('/get-check-send-money-today/:id', userController.getCheckSendMoneyToday);
//router.post('/refresh-token', userController.refreshToken);


module.exports = router; 