const express = require('express');
const router = express.Router();
const { getHomeLogin, postLogin} = require('../../controllers/adminLoginController');



router.get('/loginPage', getHomeLogin);

router.post('/login', postLogin);

// router.get('/logoutPage/:id', getLogoutPage);

// router.post('/logout', getLogout);

module.exports = router; //export default router