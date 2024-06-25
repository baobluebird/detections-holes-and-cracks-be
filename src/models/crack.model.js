const mongoose = require('mongoose')

const crackSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        location: { type: String, required: true},
        address: { type: String, required: true },
        image: { type: String},
        description: { type: String},
    },
    {
        timestamps: true
    }
);


const Crack = mongoose.model("Crack", crackSchema);
module.exports = Crack;
