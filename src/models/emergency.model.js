const mongoose = require('mongoose')

const emergencySchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        phone: { type: Number, require: true},
        location: { type: String, required: true},
        address: { type: String, required: true },
    },
    {
        timestamps: true
    }
);


const Emergency = mongoose.model("Emergency", emergencySchema);
module.exports = Emergency;
