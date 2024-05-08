const CodeServices = require('../services/code.services');  
const JwtService = require('../services/JwtService');

const createCode = async (req, res) => {
    try {
        const email = req.body.email
        if(!email){
            return res.status(200).json({
                status: 'ERR',
                message: 'The email is required'
            })
        }
        const response = await CodeServices.createCode(email)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}
const resendCode = async (req, res) => {
    try {
        const email = req.body.email
        if(!email){
            return res.status(200).json({
                status: 'ERR',
                message: 'The email is required'
            })
        }
        const response = await CodeServices.resendCode(email)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const verifyCode = async (req, res) => {
    try {
        const id = req.params.id
        const {code} = req.body
        if( !id || !code){
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        const response = await CodeServices.verifyCode(id, code)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const createTokenEmail = async (req, res) => {
    try {
        const {email} = req.body
        if(!email){
            return res.status(200).json({
                status: 'ERR',
                message: 'The email is required'
            })
        }
        const response = await CodeServices.createTokenEmail(email)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const checkTokenEmail = async (req, res) => {
    try {
        const token = req.params.id
        if(!token){
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        const response = await CodeServices.checkTokenEmail(token,res)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const resetPassword = async (req, res) => {
    try {
        const {password, confirmPassword} = req.body
        const userId = req.params.id
        if(!password || !userId || !confirmPassword){
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        if(password != confirmPassword){
            return res.status(200).json({
                status: 'ERR',
                message: 'The password must be equal'
            })
        }
        const response = await CodeServices.resetPassword(userId,password)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

module.exports = {
    createCode,
    verifyCode,
    createTokenEmail,
    checkTokenEmail,
    resendCode,
    resetPassword
}