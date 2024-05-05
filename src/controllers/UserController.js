const UserService = require('../services/UserServices');  
const JwtService = require('../services/JwtService');

const loginUser = async (req, res) => {
    try {
        console.log('request');
        const {email, password} = req.body

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

const resetPassword = async (req, res) => {
    try {
        const {email} = req.body
        email = email.replace(/\s/g, "");
        const reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
        const isCheckEmail = reg.test(email)
        if (!email) {
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
        const response = await UserService.resetPassword(req.body)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({ 
            message: e
        })
    }
}

const verifyCode = async (req, res) => {
    try {
        const {code} = req.body
        code = code.replace(/\s/g, "");
        if (!code) {
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        } 
        const response = await UserService.verifyCode(req.body)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({ 
            message: e
        })
    }

}

const logoutUser = async (req, res) => {
    try {
        const token = req.body;
        if(!token){
            return res.status(200).json({
                status: 'ERR',
                message: 'The token is required'
            })
        }
        const response = await UserService.logoutUser(token)
        return res.status(200).json(response)
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
        if(data.confirmPassword != data.password){
            return res.status(200).json({
                status: 'ERR',
                message: 'The password and confirmPassword is not match'
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

const getImage = async (req, res) => {
    try {
        const userId = req.params.id;
        if(!userId){
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        const response = await UserService.getImage(userId)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({ 
            message: e
        })
    }
}
const updatePass = async (req, res) => {
    try {
        const userId = req.params.id;
        const data = req.body;
        if(!userId){
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        if(data.confirmPassword != data.password){
            return res.status(200).json({
                status: 'ERR',
                message: 'The password and confirmPassword is not match'
            })
        }
        const response = await UserService.updatePass(userId, data)
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

const sendMoney = async (req, res) => {
    try {
        const userId = req.params.id
        const {money, nameGoal} = req.body
        if(!money || !userId){
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        const sendMoney = {userId, nameGoal, money}
        const response = await UserService.sendMoney(sendMoney)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({ 
            message: e
        })
    }
}

const getTotalMoney = async (req, res) => {
    try {
        const userId = req.params.id
        const nameGoal = req.body
        if(!userId){
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        const response = await UserService.getTotalMoney(userId, nameGoal)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({ 
            message: e
        })
    }
}

const getLogMoneySend = async (req, res) => {
    try {
        const userId = req.params.id
        const nameGoal = req.body
        if(!userId || !nameGoal){
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        const response = await UserService.getLogMoneySend(userId, nameGoal)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({ 
            message: e
        })
    }
}

const createGoal = async (req, res) => {
    try {
        const userId = req.params.id
        const {nameGoal, goalMoney} = req.body
        if(!nameGoal || !goalMoney){
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        const goal = {userId, nameGoal, goalMoney}
        const response = await UserService.createGoal(goal)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({ 
            message: e
        })
    }
}

const getListNameGoal = async (req, res) => {
    try {
        const userId = req.params.id
        if(!userId){
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        const response = await UserService.getListNameGoal(userId)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({ 
            message: e
        })
    }
}

const getCheckSendMoneyToday = async (req, res) => {
    try {
        const userId = req.params.id
        const nameGoal = req.body
        if(!userId){
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        const response = await UserService.getCheckSendMoneyToday(userId, nameGoal)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({ 
            message: e
        })
    }
}
module.exports = {
    loginUser,
    logoutUser,
    resetPassword,
    verifyCode,
    updatePass,
    decodeToken,
    getImage,
    updateUser,
    getDetailsUser,
    sendMoney,
    getTotalMoney,
    getLogMoneySend,
    createGoal,
    getListNameGoal,
    getCheckSendMoneyToday
}