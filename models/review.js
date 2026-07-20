const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  artwork: { type: mongoose.Schema.Types.ObjectId, ref: "Artwork" },
  content: { type: String, required: true },
  approved: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);
