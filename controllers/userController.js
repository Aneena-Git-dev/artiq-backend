// controllers/userController.js
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

// helper
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const newUser = new User({ name, email, password });
    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        bio: newUser.bio,
        location: newUser.location,
        profileImage: newUser.profileImage,
      },
      token: generateToken(newUser._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        bio: user.bio,
        location: user.location,
        profileImage: user.profileImage,
      },
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// returns currently logged-in user (req.user set by protect)
exports.getMe = async (req, res) => {
  try {
    // req.user already excludes password in middleware
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// update profile (support multipart/form-data with profileImage file)
exports.updateUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Update fields if provided
    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.bio !== undefined) user.bio = req.body.bio;
    if (req.body.location !== undefined) user.location = req.body.location;

    // file upload handling
    if (req.file) {
      // delete old file if exists and is a local upload path (starts with /uploads/)
      if (user.profileImage && user.profileImage.startsWith("/uploads/")) {
        const oldPath = path.join(__dirname, "..", user.profileImage);
        try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch (e) { console.warn("Old image delete failed", e.message); }
      }
      user.profileImage = `/uploads/${req.file.filename}`; // store relative path
    }

    const updated = await user.save();

    res.json({
      message: "Profile updated",
      user: {
        id: updated._id,
        name: updated.name,
        email: updated.email,
        bio: updated.bio,
        location: updated.location,
        profileImage: updated.profileImage,
      },
    });
  } catch (err) {
    console.error("updateUser Error:", err);
    res.status(500).json({ message: err.message });
  }
};
