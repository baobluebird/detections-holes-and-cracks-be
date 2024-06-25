const User = require('../models/user.model')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const {generalAccessToken, generalAccessTokenForEmail} = require("./JwtService");
const jwt = require('jsonwebtoken');

const createUser = async (data) => {
    return new Promise(async (resolve, reject) => {
    try {
        const user = data
        const checkUser = await User.findOne({ email: user.email });
        if (checkUser) {
          return resolve({
            status: "error",
            message: "Email already exists",
          });
        }else{
            console.log('data',user)
            user.password = bcrypt.hashSync(user.password, 10)
            await User.create({
                name: user.name,
                date: user.date,
                email: user.email,
                password: user.password,
                phone: user.phone
            })
            resolve({
                status: 'OK',
                message: 'Create user successfully'
            })
        }
    } catch (error) {
        reject(error);
      }
    });
  };

const loginUser = async (data) => {
    return new Promise(async (resolve, reject) => {
    try {
        const user = data
        console.log('data',user)
        const checkUser = await User.findOne({ email: user.email });
        if (checkUser == null) {
          return resolve({
            status: "error",
            message: "The user is not exist",
          });
        }
        const comparePassword = await bcrypt.compareSync(
            user.password,
            checkUser.password
        );
        if (!comparePassword) {
          return resolve({
            status: "error",
            message: "The password is incorrect",
          });
        }
  
        const access_token = await generalAccessToken({
          id: checkUser._id,
          isAdmin: checkUser.isAdmin,
        });
            resolve({
                userId: checkUser._id,
                name: checkUser.name,
                isAdmin: checkUser.isAdmin,
                access_token,
                status: 'OK',
                message: 'Login successfully'
            })
        
    } catch (error) {
        reject(error);
      }
    });
  };

const getId = async (token) => {
    return new Promise(async (resolve, reject) => {
    try {
        jwt.verify(token, process.env.ACCESS_TOKEN, function(err, user){
            if(err){
                reject ({
                    status: 'ERR',
                    message: 'Unauthorized'
                })
            }
            const  {payload} = user
            resolve({
                id: payload?.id,
                status: 'OK',
                message: 'Get id successfully'
            })
        });
    } catch (error) {
        reject(error);
      }
    });
  }

const updateUser = async (userId, data) => {
    return new Promise(async (resolve, reject) => {
    try {
        const response = await User.updateUser(userId, data)
        
        if (!response) {
            reject ({
                status: 'ERR',
                message: 'Update user failed'
            })
        }
        else if (response === 'Email is already in use by another user') {
            reject ({
                status: 'ERR',
                message: 'Email is already in use by another user'
            })
        }
        else if (response === 'Phone number is already in use by another user') {
            reject ({
                status: 'ERR',
                message: 'Phone number is already in use by another user'
            })
        }
        else {
            resolve({
                user: response,
                status: 'OK',
                message: 'Update user successfully'
            })
        }
    } catch (error) {
        reject(error);
      }
    });
  };

const getDetailsUser = async (userId) => {
    return new Promise(async (resolve, reject) => {
    try {
        const response = await User.getDetailsUser(userId)
        if (!response) {
            reject ({
                status: 'ERR',
                message: 'Get user failed'
            })
        }
        else {
            resolve({
                user: response,
                status: 'OK',
                message: 'Get user successfully'
            })
        }
    } catch (error) {
        reject(error);
      }
    });
  };

const changePassword = async (userId, password) => {
    return new Promise(async (resolve, reject) => {
    try {
        const response = await User.changePassword(userId, password)
        if (!response) {
            reject ({
                status: 'ERR',
                message: 'Change password failed'
            })
        }
        else if(response === 'Old password is incorrect'){
            reject ({
                status: 'ERR',
                message: 'Old password is incorrect'
            })
        }
        else if(response === 'New password must be different from the old password') {
            reject ({
                status: 'ERR',
                message: 'New password must be different from the old password'
            })
        }
        else {
            resolve({
                status: 'OK',
                message: 'Change password successfully'
            })
        }
    } catch (error) {
        reject(error);
      }
    });
  };

const decodeToken = async (token) => {
    return new Promise(async (resolve, reject) => {
    try {
        await jwt.verify(token.token, process.env.ACCESS_TOKEN, function(err, user){
            if(err){
                resolve ({
                    status: 'ERR',
                    message: 'Unauthorized'
                })
            }
            const  {payload} = user
            resolve({
                isAdmin: payload?.isAdmin,
                status: 'OK',
                message: 'Decode token successfully'
            })
        });
    } catch (error) {
        reject(error);
      }
    });
  }

module.exports = {
    createUser,
    loginUser,
    getId,
    updateUser,
    getDetailsUser,
    changePassword,
    decodeToken
}