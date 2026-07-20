// src/controllers/artworkController.js
const Artwork = require("../models/artwork");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const User = require("../models/user");

// ==========================
// Helper: Save image from URL to uploads folder
// ==========================
const saveImageFromUrl = async (imageUrl) => {
  try {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const ext = path.extname(imageUrl).split("?")[0] || ".jpg";
    const fileName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    const filePath = path.join(__dirname, "../uploads/", fileName);
    fs.writeFileSync(filePath, response.data);
    return `/uploads/${fileName}`;
  } catch (err) {
    console.error("❌ Failed to save image from URL:", err.message);
    return null;
  }
};



// ==========================
// Upload Artwork
// ==========================
exports.uploadArtwork = async (req, res) => {
  try {
    const { title, price, category, description } = req.body;

    if (!title || !price) {
      return res.status(400).json({ message: "Title and price are required." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Artwork image is required." });
    }

    const imagePath = `/uploads/${req.file.filename}`;

    const artwork = await Artwork.create({
      title,
      price,
      category,
      description,
      image: imagePath,
      uploadedBy: req.user.id,
    });

    res.status(201).json({
      message: "Artwork uploaded successfully!",
      artwork,
    });
  } catch (err) {
    console.error("❌ Upload Error:", err);
    res.status(500).json({ message: "Server error while uploading artwork.", error: err.message });
  }
};


// ==========================
// List all artworks (with search, filter, pagination)
// ==========================
exports.getAllArtworks = async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, page = 1, limit = 12 } = req.query;

    const filter = {};
    if (q) filter.title = { $regex: q, $options: "i" };
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Artwork.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("uploadedBy", "username name")
        .lean(),
      Artwork.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error("❌ Fetch Error:", err.message);
    res.status(500).json({ message: "Server error while fetching artworks.", error: err.message });
  }
};

// ==========================
// Read one artwork
// ==========================
exports.getArtworkById = async (req, res) => {
  try {
    const art = await Artwork.findById(req.params.id).populate("uploadedBy", "name email");
    if (!art) return res.status(404).json({ message: "⚠️ Artwork not found." });
    res.json(art);
  } catch (err) {
    console.error("❌ Fetch Single Error:", err.message);
    res.status(500).json({ message: "Server error while fetching artwork.", error: err.message });
  }
};

// ==========================
// Get artworks uploaded by logged-in user (Profile page)
// ==========================
exports.getUserArtworks = async (req, res) => {
  try {
    const userId = req.user.id;

    const artworks = await Artwork.find({ uploadedBy: userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      message: "✅ User artworks fetched successfully.",
      count: artworks.length,
      artworks,
    });
  } catch (err) {
    console.error("❌ Profile Artworks Error:", err.message);
    res.status(500).json({ message: "Server error while fetching user artworks.", error: err.message });
  }
};

// ==========================
// Update artwork (owner only)
// ==========================
exports.updateArtwork = async (req, res) => {
  try {
    const art = await Artwork.findById(req.params.id);
    if (!art) return res.status(404).json({ message: "⚠️ Artwork not found." });

    if (art.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "🚫 Not authorized to update this artwork." });
    }

    const { title, price, category, description, imageUrl } = req.body;

    if (title !== undefined) art.title = title;
    if (price !== undefined) art.price = price;
    if (category !== undefined) art.category = category;
    if (description !== undefined) art.description = description;

    // Replace image if file uploaded
    if (req.file) {
      art.image = `/uploads/${req.file.filename}`;
    }
    // Replace image if imageUrl provided
    else if (imageUrl) {
      const savedPath = await saveImageFromUrl(imageUrl);
      if (savedPath) art.image = savedPath;
    }

    const updated = await art.save();
    res.json({ message: "✅ Artwork updated successfully.", artwork: updated });
  } catch (err) {
    console.error("❌ Update Error:", err.message);
    res.status(500).json({ message: "Server error while updating artwork.", error: err.message });
  }
};

// ==========================
// Delete artwork (owner only)
// ==========================
exports.deleteArtwork = async (req, res) => {
  try {
    const art = await Artwork.findById(req.params.id);
    if (!art) return res.status(404).json({ message: "⚠️ Artwork not found." });

    if (art.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "🚫 Not authorized to delete this artwork." });
    }

    await art.deleteOne();
    res.json({ message: "✅ Artwork deleted successfully." });
  } catch (err) {
    console.error("❌ Delete Error:", err.message);
    res.status(500).json({ message: "Server error while deleting artwork.", error: err.message });
  }
};
