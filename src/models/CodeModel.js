const mongoose = require('mongoose')

const codeSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        code: { type: String, required: true },
    },
    {
        timestamps: true
    }
);


const Code = mongoose.model("Code", codeSchema);
module.exports = Code;
