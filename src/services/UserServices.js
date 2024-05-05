const User = require("../models/UserModel");
const Code = require("../models/CodeModel");
const Piggy = require("../models/PiggyMode");
const dotenv = require("dotenv");
dotenv.config();
const bcrypt = require("bcrypt");
const { generalAccessToken } = require("./JwtService");
const crypto = require("crypto");
const EmailService = require("../services/EmailService");

const loginUser = (userLogin) => {
  return new Promise(async (resolve, reject) => {
    const { email, password } = userLogin;
    try {
      const checkUser = await User.findOne({ email: email });
      if (checkUser === null) {
        resolve({
          status: "ERR",
          message: "The user is not defined",
        });
      }
      const comparePassword = await bcrypt.compareSync(
        password,
        checkUser.password
      );
      if (!comparePassword) {
        resolve({
          status: "ERR",
          message: "The password is incorrect",
        });
      }

      const access_token = await generalAccessToken({
        id: checkUser._id,
        isAdmin: checkUser.isAdmin,
      });
      const data = {
        accessToken: access_token,
      };
      await User.findByIdAndUpdate(checkUser.id, data, { new: true });
      // const refresh_token = await generalRefreshToken({
      //     id: checkUser._id,
      //     isAdmin : checkUser.isAdmin
      // });
      const name = checkUser.name;
      const id = checkUser._id;

      resolve({
        status: "success",
        message: "Login successfully",
        id,
        name,
        access_token,
        //refresh_token
      });
      console.log("success login");
    } catch (error) {
      reject(error);
    }
  });
};

const resetPassword = (data) => {
  return new Promise(async (resolve, reject) => {
    const { email } = data;
    email = email.replace(/\s/g, "");
    try {
      const checkUser = await User.findOne({ email: email });
      if (checkUser === null) {
        return resolve({
          status: "ERR",
          message: "The user is not defined",
        });
      }

      const verificationCode = crypto
        .randomBytes(3)
        .toString("hex")
        .toUpperCase();

      const check = await Code.findOne({ email: email });
      if (check) {
        resolve({
          status: "error",
          message: "Please check your email box",
        });
      }

      const createCode = await Code.create({
        email,
        user: checkUser._id,
        code: verificationCode,
      });
      if (createCode) {
        resolve({
          status: "success",
          message: "Email sended",
        });
      }

      await EmailService.sendEmail(email, verificationCode);

      resolve({
        status: "success",
        message: "Email send successfully",
      });
    } catch (error) {
      reject(error);
    }
  });
};

const verifyCode = (data) => {
  return new Promise(async (resolve, reject) => {
    const { code } = data;
    code = code.replace(/\s/g, "");
    try {
      const checkCode = await Code.findOne({ code: code });
      if (checkCode === null) {
        return resolve({
          status: "error",
          message: "The code is wrong",
        });
      } else {
        resolve({
          status: "success",
          message: "Success verify code",
          data: checkCode.user,
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

const decodeToken = (data) => {
  return new Promise(async (resolve, reject) => {
    const { token } = data;
    try {
      const checkToken = await User.findOne({ accessToken: token });
      if (checkToken === null) {
        return resolve({
          status: "ERR",
          message: "Unauthorized",
        });
      } else {
        resolve({
          status: "OK",
          message: "Decode successfully",
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

const logoutUser = (data) => {
  return new Promise(async (resolve, reject) => {
    const { token } = data;
    try {
      const checkToken = await User.findOne({ accessToken: token });
      if (checkToken === null) {
        return resolve({
          status: "ERR",
          message: "Unauthorized",
        });
      }
      const data = {
        accessToken: null,
      };
      await User.findByIdAndUpdate(checkToken.id, data, { new: true });
      resolve({
        status: "success",
        message: "Decode successfully",
      });
    } catch (error) {
      reject(error);
    }
  });
};

const getImage = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkUser = await User.findOne({ _id: id });

      if (!checkUser) {
        return resolve({
          status: "error",
          message: "The user is not exist",
        });
      }
      const image = checkUser.image;
      resolve({
        image,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      reject(error);
    }
  });
};
const updateUser = (id, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkUser = await User.findOne({ _id: id });
      const checkEmail = await User.findOne({ email: data.email });

      if (checkEmail) {
        return resolve({
          status: "error",
          message: "Email already exists",
        });
      }

      if (!checkUser) {
        return resolve({
          status: "error",
          message: "The user is not exist",
        });
      }

      if (data.password && data.oldPassword) {
        if (data.password === data.oldPassword) {
          return reject({
            status: "error",
            message: "The new password must be different from the old password",
          });
        }

        const comparePassword = await bcrypt.compare(
          data.oldPassword,
          checkUser.password
        );

        if (!comparePassword) {
          return reject({
            status: "error",
            message: "The old password is incorrect",
          });
        }

        const hashPassword = await bcrypt.hash(data.password, 10);
        data.password = hashPassword;
      }

      const updatedUser = await User.findByIdAndUpdate(id, data, { new: true });
      resolve({
        status: "success",
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      reject(error);
    }
  });
};

const updatePass = (id, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkUser = await User.findOne({ _id: id });
      if (!checkUser) {
        return resolve({
          status: "error",
          message: "The user is not exist",
        });
      }

      const comparePassword = await bcrypt.compare(
        data.password,
        checkUser.password
      );
      if (comparePassword) {
        return resolve({
          status: "error",
          message: "The new password must be different from the old password",
        });
      }
      const hashPassword = await bcrypt.hash(data.password, 10);
      data.password = hashPassword;

      const updatedUser = await User.findByIdAndUpdate(id, data, { new: true });
      const code = await Code.findOne({ user: id });
      if (code) {
        await Code.findByIdAndDelete(code._id);
      }
      if (updatedUser) {
        resolve({
          status: "success",
          message: "Update password successfully",
        });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      reject(error);
    }
  });
};

const deleteUser = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkUser = await User.findOne({
        _id: id,
      });

      if (checkUser == null) {
        resolve({
          status: "error",
          message: "The user is not exist",
        });
      }

      await User.findByIdAndDelete(id);
      resolve({
        status: "success",
        message: "User delete successfully",
      });
    } catch (error) {
      reject(error);
    }
  });
};

const getAllUser = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const allUser = await User.find();
      resolve({
        status: "success",
        message: "Get all user successfully",
        data: allUser,
      });
    } catch (error) {
      reject(error);
    }
  });
};

const getDetailsUser = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findOne({
        _id: id,
      });

      if (user == null) {
        return resolve({
          status: "error",
          message: "The user is not exist",
        });
      }

      resolve({
        status: "success",
        message: "Get detail user id:" + id + " successfully",
        data: user,
      });
    } catch (error) {
      reject(error);
    }
  });
};

const getDetailsUserWithCart = async (id) => {
  try {
    const userWithCarts = await User.findById(id).populate({
      path: "carts",
      populate: {
        path: "orderItems.product",
        model: "Product",
      },
    });

    if (!userWithCarts) {
      return {
        status: "error",
        message: "The user does not exist",
      };
    }

    return {
      status: "success",
      message: `Get detail user id: ${id} successfully`,
      data: userWithCarts.carts,
    };
  } catch (error) {
    return {
      status: "error",
      message: "An error occurred while fetching user details",
      error: error.message,
    };
  }
};

const deleteManyUser = (ids) => {
  return new Promise(async (resolve, reject) => {
    try {
      await User.deleteMany({ _id: ids });
      resolve({
        status: "success",
        message: "Delete user success",
      });
    } catch (e) {
      reject(e);
    }
  });
};


const sendMoney = async (data) => {
  try {
    const { userId, nameGoal, money } = data;
    console.log(userId);
    console.log(nameGoal);
    console.log(money);

    // Check user existence
    const checkUser = await Piggy.findOne({ user: userId});
    if (!checkUser) {
      return {
        status: "error",
        message: "The user or name goal does not exist",
      };
    }

    const time = new Date();
    const checkPiggy = await Piggy.findOne({ user: userId, nameGoal: nameGoal });
    if (checkPiggy) {
      const timeMonth = time.getMonth();
      const timeDate = time.getDate();
      const updatedAtMonth = checkPiggy.updatedAt.getMonth();
      const updatedAtDate = checkPiggy.updatedAt.getDate();

      // Check if month and date components of time and updatedAt match
      if (timeMonth === updatedAtMonth && timeDate === updatedAtDate) {
        // Find entries in moneySend with the same month and date as updatedAt
        const moneySendEntry = checkPiggy.moneySend.find((entry) => {
          const entryMonth = entry.time.getMonth();
          const entryDate = entry.time.getDate();
          return entryMonth === updatedAtMonth && entryDate === updatedAtDate;
        });

        if (moneySendEntry) {
          // If entry found, update money and totalMoney
          moneySendEntry.money += money;
          checkPiggy.currentMoney += money;
          await checkPiggy.save();
        } else {
          // If no entry found, push a new entry to moneySend array
          checkPiggy.moneySend.push({ money: money, time: time });
          checkPiggy.currentMoney += money;
          await checkPiggy.save();
        }

        return {
          data: checkPiggy,
          status: "success",
          message: "Money updated successfully",
        };
      } else {
        const updatedPiggy = await Piggy.findByIdAndUpdate(
          checkPiggy._id,
          {
            $push: {
              moneySend: {
                money: money,
                time: time,
              },
            },
            $inc: {
              currentMoney: money,
            },
          },
          { new: true }
        );

        return {
          data: updatedPiggy,
          status: "success",
          message: "Money updated successfully",
        };
      }
    }

    // If no piggy record for today, create a new one
    const newPiggy = await Piggy.create({
      user: userId,
      moneySend: [{ money: money, time: time }],
      currentMoney: money,
    });

    return {
      data: newPiggy,
      status: "success",
      message: "Money sent successfully",
    };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const getTotalMoney = async (userId, nameGoal) => {
  try {
    const checkUser = await User.findOne({ _id: userId });
    if (!checkUser) {
      return {
        status: "error",
        message: "The user does not exist",
      };
    }

    const checkPiggy = await Piggy.findOne({
      user: userId,
      nameGoal: nameGoal.nameGoal,
    });
    if (!checkPiggy) {
      return {
        status: "error",
        message: "The piggy does not exist",
      };
    }
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // Lưu ý: Tháng bắt đầu từ 0
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();
    const currentDayOfWeek = today.getDay();

    const moneyByDateMap = new Map();
    const moneyByDayOfWeekMap = new Map();

    checkPiggy.moneySend.forEach((entry) => {
      const entryMonth = entry.time.getMonth() + 1;
      const entryYear = entry.time.getFullYear();
      const entryDay = entry.time.getDate();
    
      // Xử lý các mục trong tháng hiện tại
      if (entryMonth === currentMonth && entryYear === currentYear) {
        const currentTotalByDate = moneyByDateMap.get(entryDay) || 0;
        moneyByDateMap.set(entryDay, currentTotalByDate + entry.money);
      }
    
      // Xử lý các mục trong tuần hiện tại
      if (
        entryMonth === currentMonth &&
        entryYear === currentYear &&
        entryDay >= currentDay - currentDayOfWeek &&
        entryDay <= currentDay + (7 - currentDayOfWeek)
      ) {
        const entryDayOfWeek = entry.time.getDay();
        let dayOfWeek = entryDayOfWeek === 0 ? 7 : entryDayOfWeek; // Chuyển ngày chủ nhật thành 7
        const currentTotalByDayOfWeek = moneyByDayOfWeekMap.get(dayOfWeek) || 0;
        moneyByDayOfWeekMap.set(dayOfWeek, currentTotalByDayOfWeek + entry.money);
      }
    });

    const listMoneySendByMonth = [...moneyByDateMap.entries()];
    const listMoneySendByWeek = [...moneyByDayOfWeekMap.entries()];

    console.log("listMoneySendbyMonth:", listMoneySendByMonth);
    console.log("listMoneySendbyDayOfWeek:", listMoneySendByWeek);

    const currentMoney = checkPiggy.currentMoney;
    return {
      status: "success",
      message: "Get total money successfully",
      listMoneySendByMonth: listMoneySendByMonth,
      listMoneySendByWeek: listMoneySendByWeek,
      currentMoney: currentMoney,
      goalMoney: checkPiggy.goalMoney,
    };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const getLogMoneySend = async (userId, data) => {
  try {
    console.log(userId);
    console.log(data);
    const checkUser = await User.findOne({ _id: userId });
    if (!checkUser) {
      return {
        status: "error",
        message: "The user does not exist",
      };
    }

    const checkPiggy = await Piggy.findOne({ user: userId, nameGoal: data.nameGoal});
    if (!checkPiggy) {
      return {
        status: "error",
        message: "The piggy does not exist",
      };
    }

    const moneySend = checkPiggy.moneySend;
    return {
      status: "success",
      message: "Get log money send successfully",
      data: moneySend,
    };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const createGoal = async (data) => {
  try {
    const { userId, nameGoal, goalMoney } = data;
    console.log('newgoal',data);
    const check = await Piggy.findOne({ nameGoal: nameGoal });
    if (check) {
      return {
        status: "error",
        message: "The goal name already exists",
      };
    }
    const newGoal = await Piggy.create({
      user: userId,
      nameGoal: nameGoal,
      currentMoney: 0,
      goalMoney: goalMoney,
    });
    console.log(newGoal);
    return {
      status: "success",
      message: "Create goal successfully",
      data: newGoal,
    };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const getListNameGoal = async (userId) => {
  try {
    console.log(userId);
    const checkUser = await User.findOne({ _id: userId });
    if (!checkUser) {
      return {
        status: "error",
        message: "The user does not exist",
      };
    }

    const checkPiggy = await Piggy.find({ user: userId });
    if (!checkPiggy || checkPiggy.length === 0) {
      // Kiểm tra nếu không có đối tượng nào được tìm thấy
      return {
        status: "error",
        message: "The piggy does not exist",
      };
    }

    const listNameGoal = checkPiggy.map((piggy) => piggy.nameGoal); // Sử dụng map để trích xuất nameGoal từ mỗi đối tượng Piggy
    console.log(listNameGoal);
    return {
      status: "success",
      message: "Get list name goal successfully",
      data: listNameGoal,
    };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const getCheckSendMoneyToday = async (userId, data) => {
  try {
    const checkUser = await User.findOne({ _id: userId });
    if (!checkUser) {
      return {
        status: "error",
        message: "The user does not exist",
      };
    }

    // Lấy ngày hôm nay
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Tìm Piggy của người dùng có ID là userId và moneySend.time nằm trong khoảng thời gian của ngày hôm nay
    const piggyWithSendMoneyToday = await Piggy.findOne({
      user: userId,
      nameGoal: data.nameGoal,
      "moneySend.time": {
        $gte: startOfToday,
        $lt: endOfToday,
      },
    });

    if (piggyWithSendMoneyToday) {
      // Lọc chỉ các mục trong moneySend có trường time trùng với ngày hôm nay
      const moneySendToday = piggyWithSendMoneyToday.moneySend.filter((entry) => {
        const entryDate = new Date(entry.time.getFullYear(), entry.time.getMonth(), entry.time.getDate());
        return entryDate.getTime() === startOfToday.getTime();
      });

      return {
        status: "success",
        message: "There are entries in moneySend for today",
        data: moneySendToday,
      };
    } else {
      return {
        status: "success",
        message: "There are no entries in moneySend for today",
      };
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

module.exports = {
  //createUser,
  loginUser,
  logoutUser,
  resetPassword,
  verifyCode,
  updatePass,
  updateUser,
  decodeToken,
  deleteUser,
  getImage,
  getAllUser,
  getDetailsUser,
  deleteManyUser,
  getDetailsUserWithCart,
  sendMoney,
  getTotalMoney,
  getLogMoneySend,
  createGoal,
  getListNameGoal,
  getCheckSendMoneyToday
};
