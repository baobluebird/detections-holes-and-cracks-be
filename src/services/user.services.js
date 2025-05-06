const User = require('../models/user.model')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const {generalAccessToken, generalAccessTokenForEmail} = require("./JwtService");
const jwt = require('jsonwebtoken');
const Emergency = require('../models/emergency.model');
const dotenv = require("dotenv");
dotenv.config();
const axios = require("axios");


const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);


const handleError = (error, defaultMessage) => {
    console.error(`Error: ${error.message || error}`);
    return {
        status: 'ERR',
        message: error.message || defaultMessage
    };
};

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

  const createUserWithGoogle = async (data) => {
    return new Promise(async (resolve, reject) => {
      try {
        const { email, name, googleId } = data;
  
        const checkUser = await User.findOne({ email });
        if (checkUser) {
          return reject({
            status: 'OK',
            message: 'User already exists',
          });
        }
  
        await User.create({
          name,
          email,
          password: '',
          phone: '',
          date: '',
          googleId,
        });
  
        return resolve({
          status: 'OK',
          message: 'User created with Google Sign-In',
        });
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

  const loginUserWithGoogle = async (data) => {
    return new Promise(async (resolve, reject) => {
      try {
        const { email, googleId } = data;
  
        const checkUser = await User.findOne({ email });
  
        if (!checkUser) {
          return reject({
            status: 'ERR',
            message: 'User not found',
          });
        }
  
        if (checkUser.googleId !== googleId) {
          return resolve({
            status: 'ERR',
            message: 'Google ID mismatch',
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

  const updateUser = async (userId, name, date, phone, password, oldPassword) => {
    try {
        // Kiểm tra userId
        if (!isValidObjectId(userId)) {
            return {
                status: 'ERR',
                message: 'Invalid user ID'
            };
        }

        // Tạo đối tượng cập nhật từ các tham số
        const updateData = {};
        if (name !== null) updateData.name = name;
        if (date !== null) updateData.date = date;
        if (phone !== null) updateData.phone = phone;
        if (password !== null) updateData.password = password;

        // Kiểm tra xem có trường nào được cung cấp không
        if (Object.keys(updateData).length === 0) {
            return {
                status: 'ERR',
                message: 'No fields provided for update'
            };
        }

        // Nếu cập nhật password, yêu cầu oldPassword
        if (updateData.password) {
            if (!oldPassword) {
                return {
                    status: 'ERR',
                    message: 'Old password is required to update password'
                };
            }

            if (updateData.password.length < 6) {
                return {
                    status: 'ERR',
                    message: 'New password must be at least 6 characters'
                };
            }

            const user = await User.findById(userId);
            if (!user) {
                return {
                    status: 'ERR',
                    message: 'User not found'
                };
            }

            // Kiểm tra mật khẩu cũ
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return {
                    status: 'ERR',
                    message: 'Old password is incorrect'
                };
            }

            // Kiểm tra mật khẩu mới có khác mật khẩu cũ không
            const isSameAsOld = await bcrypt.compare(updateData.password, user.password);
            if (isSameAsOld) {
                return {
                    status: 'ERR',
                    message: 'New password must be different from the old password'
                };
            }

            // Băm mật khẩu mới
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        // Kiểm tra name không được rỗng nếu được cung cấp
        if (updateData.name && updateData.name.trim() === '') {
            return {
                status: 'ERR',
                message: 'Name cannot be empty'
            };
        }

        // Cập nhật người dùng
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!user) {
            return {
                status: 'ERR',
                message: 'User not found or update failed'
            };
        }

        return {
            status: 'OK',
            message: 'Update user successfully',
            user
        };
    } catch (error) {
        // Kiểm tra lỗi cụ thể từ MongoDB
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return {
                status: 'ERR',
                message: `${field.charAt(0).toUpperCase() + field.slice(1)} is already in use`
            };
        }
        return handleError(error, 'Update user failed');
    }
};

const getDetailsUser = async (userId) => {
  try {
      if (!isValidObjectId(userId)) {
          return {
              status: 'ERR',
              message: 'Invalid user ID'
          };
      }

      const user = await User.findById(userId);
      if (!user) {
          return {
              status: 'ERR',
              message: 'User not found'
          };
      }

      return {
          status: 'OK',
          message: 'Get user successfully',
          user : user
      };
  } catch (error) {
      return handleError(error, 'Get user failed');
  }
};


const changePassword = async (userId, newPassword) => {
  try {
      // Kiểm tra userId
      if (!isValidObjectId(userId)) {
          return {
              status: 'ERR',
              message: 'Invalid user ID'
          };
      }

      const user = await User.findById(userId);
      if (!user) {
          return {
              status: 'ERR',
              message: 'User not found'
          };
      }


      const isMatch = await bcrypt.compare(newPassword, user.password);
      if (!isMatch) {
          return {
              status: 'ERR',
              message: 'Old password is incorrect'
          };
      }

      // Cập nhật mật khẩu mới
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.update(userId, { password: hashedPassword });

      return {
          status: 'OK',
          message: 'Change password successfully'
      };
  } catch (error) {
      return handleError(error, 'Change password failed');
  }
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

  function getLocationCoordinates(locationString) {
    const startIndex = locationString.indexOf("(");
    const endIndex = locationString.indexOf(")");
    if (startIndex !== -1 && endIndex !== -1) {
        const latLngString = locationString.substring(startIndex + 1, endIndex);
        
        // Split by comma without extra space
        const latLngParts = latLngString.split(",");
        
        const latitude = parseFloat(latLngParts[0].trim());
        const longitude = parseFloat(latLngParts[1].trim());
        
        
        if (!isNaN(latitude) && !isNaN(longitude)) {
            return { latitude, longitude };
        } else {
            console.log("Invalid coordinates format");
            return null;
        }
    } else {
        console.log("Invalid location string format");
        return null;
    }
}

  
  async function getAddressFromCoordinates(latitude, longitude) {
    try {
      const apiKey = process.env.API_GOOGLE_KEY;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
      const response = await axios.get(url);
      const address = response.data.results[0].formatted_address;
      return address;
    } catch (error) {
      console.error("Error fetching address:", error.message);
      return null;
    }
  }

const sendHelp = async (userId, location) =>{
    return new Promise(async (resolve, reject) => {
    try {
        const io = global.io;

        const user = await User.findById(userId)
        const { latitude, longitude } = getLocationCoordinates(location);
        const address = await getAddressFromCoordinates(latitude, longitude);
        const help = await Emergency.create({
            name: user.name,
            user: userId,
            phone: user.phone,
            location: location,
            address: address
        })
        if (!help) {
            reject ({
                status: 'ERR',
                message: 'Send help failed'
            })
        }
        else {
            const getData = await Emergency.find()
            io.emit("newDataSendHelpAdded", getData);
            resolve({
                status: 'OK',
                message: 'Send help successfully'
            })
        }
    } catch (error) {
        reject(error);
      }
    });
  
}

const getDataSendHelp = async () => {
    return new Promise(async (resolve, reject) => {
      try {
          const getData = await Emergency.find()
          if(!getData){
              resolve({
                  status: 'ERR',
                  message: 'Get data failed'
              })
          }
          resolve({
              data:getData,
              status: 'OK',
              message: 'Get data successfully'
          })
      } catch (error) {
        reject(error);
      }
    });
  };
  

module.exports = {
    createUser,
    createUserWithGoogle,
    loginUser,
    loginUserWithGoogle,
    getId,
    updateUser,
    getDetailsUser,
    changePassword,
    decodeToken,
    sendHelp,
    getDataSendHelp
}