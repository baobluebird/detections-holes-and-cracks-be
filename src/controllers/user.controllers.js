const UserService = require('../services/user.services');
const JwtService = require('../services/JwtService');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const createUser = async (req, res) => {
    try {
        const { name, date, email, password, confirmPassword, phone, googleId } = req.body
        const reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
        const isCheckEmail = reg.test(email)
        if (!name || !date || !email || !password || !confirmPassword || !phone) {
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
        console.log('sign up', email)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const createUserWithGoogle = async (req, res) => {
    try {
        const { name, email, googleId } = req.body;
        console.log('sign up with google', email)
        if (!name || !email || !googleId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Email or Google ID is missing',
            });
        }

        const user = req.body
        const response = await UserService.createUserWithGoogle(user)
        console.log('sign up', email)
        return res.status(200).json(response)
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const createUserWithGoogleForWeb = async (req, res) => {
  try {
    const { id_token } = req.body;
    if (!id_token) {
      return res.status(400).json({
        status: 'ERR',
        message: 'Missing Google ID token',
      });
    }

    // Verify ID token with Google
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name || '';
    const googleId = payload.sub;

    // Gọi service để đăng ký người dùng mới
    const response = await UserService.createUserWithGoogleForWeb({ email, name, googleId });

    return res.status(200).json(response);
  } catch (error) {
    console.error('Google Sign-Up Error:', error);
    return res.status(500).json({ status: 'ERR', message: error.message || 'Internal Server Error' });
  }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        console.log('sign in', email)
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

const loginUserWithGoogle = async (req, res) => {
    try {
        const { email, googleId } = req.body;

        if (!email || !googleId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Missing email or Google ID',
            });
        }

        const response = await UserService.loginUserWithGoogle(req.body);
        return res.status(200).json(response);

    } catch (error) {
        return res.status(500).json({
            status: 'ERR',
            message: error.message,
        });
    }
};

const loginUserWithGoogleForWeb = async (req, res) => {
    try {
        const { id_token, remember } = req.body;
        if (!id_token) {
            return res.status(400).json({ status: 'ERR', message: 'Missing Google ID token' });
        }

        // Verify id_token
        const ticket = await client.verifyIdToken({
            idToken: id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const email = payload.email;
        const googleId = payload.sub; // Unique Google user ID

        // Gọi service
        const response = await UserService.loginUserWithGoogleForWeb({ email, googleId, remember });
        return res.status(200).json(response);

    } catch (error) {
        console.error('Google Sign-In error:', error);
        return res.status(500).json({ status: 'ERR', message: error.message });
    }
};

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
        const { name, date, phone, password, oldPassword } = req.body
        console.log(req.body)
        if (!name && !date && !phone && !userId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        const response = await UserService.updateUser(userId, name, date, phone, password, oldPassword)
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
        const { password, confirmPassword } = req.body;
        if (!userId || !password || !confirmPassword) {
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        if (password !== confirmPassword) {
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
        if (!userId) {
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
        if (!userId) {
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

        if (!userId) {
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

        if (!token) {
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
        if (!token) {
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
        const { location } = req.body;
        if (!location || !userId) {
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
        return res.render('homeDataSendHelp.ejs', { listData: listData.data, count: listData.data.length });
    } catch (e) {
        return res.status(404).json({
            message: e.message || 'Error fetching users',
        });
    }
}

const getLogin = async (req, res) => {
    try {
        return res.render('login.ejs', {
            googleClientID: process.env.API_WEB_GOOOGLE_KEY,
        });
    } catch (e) {
        return res.status(404).json({
            message: e.message || 'Error fetching damage data',
        });
    }
};
const getRegister = async (req, res) => {
    try {
        return res.render('register.ejs', {
            googleClientID: process.env.API_WEB_GOOOGLE_KEY,
        });
    } catch (e) {
        return res.status(404).json({
            message: e.message || 'Error fetching damage data',
        });
    }
};

const getLogout = async (req, res) => {
    try {
        return res.render('logout.ejs', {
        });
    } catch (e) {
        return res.status(404).json({
            message: e.message || 'Error fetching damage data',
        });
    }
};



module.exports = {
    createUser,
    createUserWithGoogle,
    createUserWithGoogleForWeb,
    loginUser,
    loginUserWithGoogle,
    loginUserWithGoogleForWeb,

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
    getDataSendHelp,

    getLogin,
    getRegister,
    getLogout,
}