const CRUDLoginService = require('../services/CRUDLoginService');  

const getHomeLogin = async (req, res) => {
    try {
        return res.render('login.ejs');
    } catch (e) {
        return res.status(404).json({
            message: e.message || 'Error fetching users',
        });
    }
}

const postLogin = async (req, res) => {
    console.log(req.body);
    try {
      const response = await CRUDLoginService.getLogin(req.body);
        console.log(response);
      if (response.status === 'success') {
        if (response.isAdmin) {
            res.redirect('/admin/user/');
        } else {
            res.render('login.ejs', { error: 'This user is not admin' });
        }

      } else {
        res.render('login.ejs', { error: result.message });
      }
    } catch (error) {
      return res.status(500).json({
        message: 'Internal server error',
        error: error.message,
      });
    }
  };

// const getLogoutPage = async (req, res) => {
//     try {
//         const listUsers = await CRUDUserService.getAllUser();
//         return res.render('homepageUser.ejs', { listUsers: listUsers });
//     } catch (e) {
//         return res.status(404).json({
//             message: e.message || 'Error fetching users',
//         });
//     }
// }

// const getLogout = async (req, res) => {
//     try {
//         const listUsers = await CRUDUserService.getAllUser();
//         return res.render('homepageUser.ejs', { listUsers: listUsers });
//     } catch (e) {
//         return res.status(404).json({
//             message: e.message || 'Error fetching users',
//         });
//     }
// }

module.exports = {
    getHomeLogin,
    postLogin,
    // getLogoutPage,
    
}