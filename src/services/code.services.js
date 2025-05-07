const Code = require("../models/code.model");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require('../models/user.model')
const mongoose = require('mongoose');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const {
  generalAccessToken,
  generalAccessTokenForEmail,
} = require("./JwtService");
const jwt = require("jsonwebtoken");
const EmailService = require("./EmailService");

// Hàm tiện ích để kiểm tra định dạng email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const generateCode = () => {
  const min = 10000; // 00000
  const max = 99999; // 99999
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const createCode = async (email) => {
  try {
      // Kiểm tra định dạng email
      if (!isValidEmail(email)) {
          return {
              status: 'ERR',
              message: 'Invalid email format'
          };
      }

      // Kiểm tra email tồn tại trong User
      const user = await User.findOne({ email });
      if (!user) {
          return {
              status: 'ERR',
              message: 'Email not found'
          };
      }

      // Tạo mã ngẫu nhiên 5 chữ số
      const code = generateCode().toString();

      // Xóa mã cũ nếu tồn tại
      await Code.deleteOne({ email });

      // Tạo và lưu mã mới
      const newCode = await Code.create({
          email,
          user: user._id,
          code
      });

      // Gửi email với mã
      await EmailService.sendEmailForgotPass(email, code);

      return {
          status: 'OK',
          message: 'Check email to get code',
          id: newCode._id
      };
  } catch (error) {
      console.error(`Error in createCode: ${error.message || error}`);
      return {
          status: 'ERR',
          message: error.message || 'Create code failed'
      };
  }
};

const verifyCode = async (codeId, code) => {
  try {
      // Kiểm tra codeId
      if (!isValidObjectId(codeId)) {
          return {
              status: 'ERR',
              message: 'Invalid code ID'
          };
      }

      // Tìm tài liệu Code
      const codeDoc = await Code.findById(codeId);
      if (!codeDoc) {
          return {
              status: 'ERR',
              message: 'Code not found'
          };
      }

      // Kiểm tra mã hết hạn
      if (codeDoc.expiresAt && codeDoc.expiresAt < new Date()) {
          await Code.deleteOne({ _id: codeId }); // Xóa mã hết hạn
          return {
              status: 'ERR',
              message: 'Code has expired'
          };
      }

      // Kiểm tra mã có khớp không
      if (codeDoc.code !== code) {
          return {
              status: 'ERR',
              message: 'Invalid code'
          };
      }

      // Xóa mã sau khi xác minh thành công
      await Code.deleteOne({ _id: codeId });

      return {
          status: 'OK',
          message: 'Check code successfully',
          userId: codeDoc.user
      };
  } catch (error) {
      console.error(`Error in verifyCode: ${error.message || error}`);
      return {
          status: 'ERR',
          message: error.message || 'Check code failed'
      };
  }
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
  try {
      // Kiểm tra userId
      if (!isValidObjectId(userId)) {
          return {
              status: 'ERR',
              message: 'Invalid user ID'
          };
      }

      // Kiểm tra mật khẩu mới
      if (!password || password.length < 6) {
          return {
              status: 'ERR',
              message: 'Invalid password: Password must be at least 6 characters'
          };
      }

      // Tìm người dùng
      const user = await User.findById(userId);
      if (!user) {
          return {
              status: 'ERR',
              message: 'User not found'
          };
      }

      // Nếu người dùng đã có mật khẩu, kiểm tra mật khẩu mới có khác không
      if (user.password) {
          const isSameAsOld = await bcrypt.compare(password, user.password);
          if (isSameAsOld) {
              return {
                  status: 'ERR',
                  message: 'New password must be different from the old password'
              };
          }
      }

      // Băm mật khẩu mới và cập nhật
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.findByIdAndUpdate(userId, { password: hashedPassword });

      return {
          status: 'OK',
          message: 'Reset password successfully'
      };
  } catch (error) {
      return handleError(error, 'Reset password failed');
  }
};

module.exports = {
  createCode,
  verifyCode,
  resetPassword,
};
