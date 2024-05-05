const CRUDUserService = require('../services/CRUDUserService');  
const getHomepage = async (req, res) => {
    try {
        const listUsers = await CRUDUserService.getAllUser();
        return res.render('homepageUser.ejs', { listUsers: listUsers });
    } catch (e) {
        return res.status(404).json({
            message: e.message || 'Error fetching users',
        });
    }
}

const postCreateUser = async (req, res) => {
    await CRUDUserService.createUser(req.body); 
    res.redirect('/admin/user/');
}

const getCreateUser = (req, res) => {
    res.render('createUser.ejs');
}

const getUpdatePage = async (req, res) => {

    const userId = req.params.id;

    let user = await CRUDUserService.getDetailsUser(userId);

    res.render('editUser.ejs', { userEdit : user });//{userEdit : user} = {userEdit : results[0]}
}

const postUpdateUser = async (req, res) => {
    const userId = req.body.userId;
    const data = req.body;

    await CRUDUserService.updateUser(userId, data)

    res.redirect('/admin/user/');

}

const postDeleteUser = async (req, res) => {
    const userId = req.params.id;
    let user = await CRUDUserService.getDetailsUser(userId);

    res.render('deleteUser.ejs', { userEdit : user });
}

const postHandleRemoveUser = async (req, res) => {
    const userId = req.body.userId;
    await CRUDUserService.deleteUser(userId)
    
    return res.redirect('/admin/user/');
}

module.exports = {
    getHomepage,
    postCreateUser,
    getCreateUser,
    getUpdatePage,
    postUpdateUser,
    postDeleteUser,
    postHandleRemoveUser
}