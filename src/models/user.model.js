const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    date: { type: Date, required: false },
    password: { type: String, required: false },
    phone: { type: String, required: false },
    googleId: { type: String, required: false },
    accessToken: { data: Buffer },
    isAdmin: { type: Boolean, default: false, required: true },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
