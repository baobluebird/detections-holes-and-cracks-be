const mongoose = require('mongoose');

const damageSchema = new mongoose.Schema(
    {
        name : { type: String, required: true },
        sourceName: { type: String, required: true },
        destinationName: { type: String, required: true },
        locationA: { type: String, required: true},
        locationB: { type: String, required: true },
    },
    {
        timestamps: true 
    }
);

const Damage = mongoose.model("Damage", damageSchema);
module.exports = Damage;
