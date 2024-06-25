const UserService = require('../services/user.services');  
const JwtService = require('../services/JwtService');

const createUser = async (req, res) => {
    try {
        const { name, date, email, password, confirmPassword, phone } = req.body
        const reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
        const isCheckEmail = reg.test(email)
        if (!name ||!date || !email || !password || !confirmPassword || !phone) {
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        } else if (!isCheckEmail) {
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is email'
            })
        } else if (password !== confirmPassword) {
            return res.status(200).json({
                status: 'ERR',
                message: 'The password is equal confirmPassword'
            })
        }
        const user = req.body
        const response = await UserService.createUser(user)
        console.log('sign up',email)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({ 
            message: e
        }) 
    }
}

const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body
        console.log('sign in',email)
        const reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
        const isCheckEmail = reg.test(email)
        if (!email || !password) {
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        } else if (!isCheckEmail) {
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is email'
            })
        }
        const response = await UserService.loginUser(req.body)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({ 
            message: e
        })
    }
}

const logoutUser = async (req, res) => {
    try {
        res.clearCookie('refresh_token')
        return res.status(200).json({
            status: 'OK',
            message: 'Logout successfully'
        })
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const data = req.body;
        if(!userId){
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        const response = await UserService.updateUser(userId, data)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({ 
            message: e
        })
    }
}

const changePassword = async (req, res) => {
    try {
        const userId = req.params.id;
        const {password, confirmPassword} = req.body;
        if(!userId || !password || !confirmPassword ){
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        if(password !== confirmPassword){
            return res.status(200).json({
                status: 'ERR',
                message: 'The password is equal confirmPassword'
            })
        }
        const response = await UserService.changePassword(userId, password)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        if(!userId){
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        const response = await UserService.deleteUser(userId)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({ 
            message: e
        })
    }
}

const getAllUser = async (req, res) => {
    try {
        const response = await UserService.getAllUser()
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({ 
            message: e
        })
    }
}

const getDetailsUser = async (req, res) => {
    try {
        const userId = req.params.id;
        if(!userId){
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }

        const response = await UserService.getDetailsUser(userId)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({ 
            message: e
        })
    }
}

const getDetailsUserWithCart = async (req, res) => {
    try {
        const userId = req.params.id;

        if(!userId){
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }

        const response = await UserService.getDetailsUserWithCart(userId)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({ 
            message: e
        })
    }
}

const refreshToken = async (req, res) => {
    try {
        const token = req.headers.token.split(' ')[1];
        
        if(!token){
            return res.status(200).json({
                status: 'ERR',
                message: 'The token is required'
            })
        }

        const response = await JwtService.refreshTokenJwtService(token)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({ 
            message: e
        })
    }
}

const deleteMany = async (req, res) => {
    try {
        const ids = req.body.ids
        if (!ids) {
            return res.status(200).json({
                status: 'ERR',
                message: 'The ids is required'
            })
        }
        const response = await UserService.deleteManyUser(ids)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const decodeToken = async (req, res) => {
    try {
        const token = req.body;
        if(!token){
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        const response = await UserService.decodeToken(token)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({ 
            message: e
        })
    }
}

const sendHelp = async (req, res) => {
    try {
        const userId = req.params.id;
        const {location} = req.body;
        if(!location || !userId){
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        const response = await UserService.sendHelp(userId, location)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({ 
            message: e
        })
    }
}

const getDataSendHelp = async (req, res) => {
    try {
        const listData = await UserService.getDataSendHelp()
        return res.render('homeDataSendHelp.ejs',{ listData: listData.data , count : listData.data.length});
    } catch (e) {
        return res.status(404).json({
            message: e.message || 'Error fetching users',
        });
    }
}

module.exports = {
    createUser,
    loginUser,
    logoutUser,
    updateUser,
    changePassword,
    deleteUser,
    getAllUser,
    getDetailsUser,
    refreshToken,
    deleteMany,
    getDetailsUserWithCart,
    decodeToken,
    sendHelp,
    getDataSendHelp
}