const mongoose = require('mongoose');

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

roadSchema.pre('save', function (next) {
    if (this.isNew) { 
        const currentDate = new Date();
        const futureDate = new Date(currentDate.getTime() + this.dateMaintain * 24 * 60 * 60 * 1000); 
        this.updatedAt = futureDate; 
    }
    next();
});

const Road = mongoose.model("Road", roadSchema);
module.exports = Road;
