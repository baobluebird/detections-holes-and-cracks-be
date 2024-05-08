const Code = require("../models/code.model");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require('../models/user.model')

const {
  generalAccessToken,
  generalAccessTokenForEmail,
} = require("./JwtService");
const jwt = require("jsonwebtoken");
const EmailService = require("./EmailService");

const createCode = async (email) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await Code.createCode(email);
      if (response.status == "ERR") {
        resolve({
          status: "ERR",
          message: "Create code failed",
        });
      } else {
        await EmailService.sendEmailForgotPass(email, response.code);
        resolve({
          id: response.id,
          status: "OK",
          message: "Check Email to get code",
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

const resendCode = async (email) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await Code.resendCode(email);
      if (response.status == "ERR") {
        resolve({
          status: "ERR",
          message: "Resend code failed",
        });
      } else {
        await EmailService.sendEmailForgotPass(email, response.code);
        resolve({
          status: "OK",
          message: "Check Email to get code",
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

const verifyCode = async (id, code) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await Code.verifyCode(id, code);
      if (response.status == "ERR") {
        resolve({
          status: "ERR",
          message: "Check code failed",
        });
      } else {
        resolve({
          userId: response.userId,
          status: "OK",
          message: "Check code successfully",
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

const createTokenEmail = async (email) => {
  return new Promise(async (resolve, reject) => {
    try {
      const access_token = await generalAccessTokenForEmail({
        email,
      });
      resolve({
        access_token,
        status: "OK",
        message: "Create token email successfully",
      });
    } catch (error) {
      reject(error);
    }
  });
};

const resetPassword = async (userId, password) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await User.resetPassword(userId, password);
      if (!response) {
        resolve({
          status: "ERR",
          message: "Reset password failed",
        });
      }else if(response == 'New password must be different from the old password') {
        resolve({
            status: "ERR",
            message: "New password must be different from the old password",
          });
      }else {
        resolve({
          status: "OK",
          message: "Reset password successfully",
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  createCode,
  verifyCode,
  resendCode,
  resetPassword,
};
