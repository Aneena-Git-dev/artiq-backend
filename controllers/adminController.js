const User = require("../models/user");
const Artwork = require("../models/artwork");

exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalArtworks = await Artwork.countDocuments();
    const totalAdmins = await User.countDocuments({ role: "admin" });

    res.json({
      totalUsers,
      totalArtworks,
      totalAdmins,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.manageUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.manageArtworks = async (req, res) => {
  try {
    const artworks = await Artwork.find().populate("uploadedBy", "name email");
    res.json(artworks);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
