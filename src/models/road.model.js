const mongoose = require('mongoose')

const roadSchema = new mongoose.Schema(
    {
        sourceName: { type: String, required: true },
        destinationName: { type: String, required: true },
        locationA: { type: String, required: true},
        locationB: { type: String, required: true },
        dateMaintain: {type: Number, required: true},

    },
    {
        timestamps: true
    }
);


const Road = mongoose.model("Road", roadSchema);
module.exports = Road;
