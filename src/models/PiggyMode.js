const mongoose = require('mongoose')

const piggySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    nameGoal: { type: String, required: true },
    moneySend: [
      {
        money: { type: Number, required: true },
        time: { type: Date, required: true }
      }
    ],
    goalMoney : { type: Number, required: true },
    currentMoney : { type: Number, required: true }
  },
  {
    timestamps: true
  }
);

const Piggy = mongoose.model("Piggy", piggySchema);
module.exports = Piggy;