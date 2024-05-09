const mongoose = require('mongoose')

const holeSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        location: { type: String, required: true},
        address: { type: String, required: true },
        image: { type: String},
        description: { type: String, required: true },
    },
    {
        timestamps: true
    }
);


const Hole = mongoose.model("Hole", holeSchema);
module.exports = Hole;
