const User = require('../models/UserModel');
const dotenv = require('dotenv');
dotenv.config();
const bcrypt = require('bcrypt');
const { generalAccessToken } = require('./JwtService');

const getLogin = async(userLogin) => {

        const { email, password} = userLogin;

        try{
            const checkUser = await User.findOne({email:email});
            if(checkUser == null){
                return {
                    status: 'error',
                    message: 'The user is not exist',
                  };
            }
            const comparePassword = await bcrypt.compareSync(password, checkUser.password);
            if(!comparePassword){
                return{
                    status: 'error',
                    message: 'The password is incorrect'
                }
            }
            
            const access_token = await generalAccessToken({
                id: checkUser._id, 
                isAdmin : checkUser.isAdmin
            });

                return{
                    status: 'success',
                    message: 'User login successfully',
                    access_token,
                    isAdmin: checkUser.isAdmin, 
                    //refresh_token
                }
        }catch(error){
            return {
            status: 'error',
            message: 'An error occurred while processing the login',
            error: error.message,
            };
        }
}

module.exports = {
   getLogin
}