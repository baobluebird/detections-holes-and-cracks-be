const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
    {
        name: { type: String ,required: true},
        email: { type: String, required: true, unique: true },
        date : {type: Date, required: true},
        password: { type: String, required: true },
        image: { data: Buffer, contentType: String },
        accessToken: { data: Buffer },
        isAdmin: { type: Boolean, default: false, required: true },
    },
    {
        timestamps: true
    }
);


const User = mongoose.model("User", userSchema);
module.exports = User;
