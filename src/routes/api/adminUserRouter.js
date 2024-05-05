const express = require('express');
const router = express.Router();
const { getHomepage, getCreateUser, getUpdatePage, postCreateUser, postUpdateUser, postDeleteUser, postHandleRemoveUser } = require('../../controllers/adminUserController');
const { authMiddleware} = require('../../middleware/authMiddleware');

router.get('/', getHomepage);

router.get('/create', getCreateUser);

router.get('/update/:id', getUpdatePage);

router.post('/create-user', postCreateUser);

router.post('/update-user', postUpdateUser);

router.post('/delete-user/:id', postDeleteUser);

router.post('/delete-user', postHandleRemoveUser);

module.exports = router; //export default router