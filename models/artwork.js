const mongoose = require('mongoose');

const artworkSchema = new mongoose.Schema({
  title: { type: String, required: true },       // Artwork title
  image: { type: String, required: true },       // URL or path of the image
  price: { type: Number, required: true },       // Price of the artwork
  category: { type: String },                    // Category like Painting, Digital, etc.
  description: { type: String },                 // Optional description
  uploadedBy: {                                  // The user who uploaded it
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',required: true 
  },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],

});

module.exports = mongoose.model('Artwork', artworkSchema);
