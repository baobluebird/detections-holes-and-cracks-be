const mongoose = require('mongoose')

const codeSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        code: { type: String, required: true },
        expiresAt: { type: Date, required: true, default: () => Date.now() + 180 * 1000 }
    },
    {
        timestamps: true
    }
);


const Code = mongoose.model("Code", codeSchema);
module.exports = Code;
