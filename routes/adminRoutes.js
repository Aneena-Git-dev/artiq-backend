const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware"); // your multer setup
const { protect, admin } = require("../middleware/authMiddleware");
const Artwork = require("../models/artwork");
const User = require("../models/user");
const fs = require("fs");
const path = require("path");
const SiteSettings = require("../models/siteSettings"); // make sure you have this model


// GET all users (admin)
router.get("/users", protect, admin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all artworks (admin)
router.get("/artworks", protect, admin, async (req, res) => {
  try {
    const artworks = await Artwork.find().populate("uploadedBy", "name email");
    res.json(artworks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE artwork (admin) - multipart/form-data with "image" file
router.post("/artworks", protect, admin, upload.single("image"), async (req, res) => {
  try {
    const { title, price, category, description } = req.body;
    if (!title || price == null) {
      return res.status(400).json({ message: "Title and price required" });
    }

    let imagePath = "";
    if (req.file) imagePath = `/uploads/${req.file.filename}`;
    else if (req.body.image) imagePath = req.body.image; // fallback URL

    const newArt = await Artwork.create({
      title,
      price,
      category,
      description,
      image: imagePath,
      uploadedBy: req.user._id,
    });

    res.status(201).json(newArt);
  } catch (err) {
    console.error("Admin create artwork error:", err);
    res.status(500).json({ message: err.message });
  }
});

// UPDATE artwork (admin)
router.put("/artworks/:id", protect, admin, upload.single("image"), async (req, res) => {
  try {
    const art = await Artwork.findById(req.params.id);
    if (!art) return res.status(404).json({ message: "Artwork not found" });

    const { title, price, category, description } = req.body;
    if (title !== undefined) art.title = title;
    if (price !== undefined) art.price = price;
    if (category !== undefined) art.category = category;
    if (description !== undefined) art.description = description;

    // replace image if a new file uploaded
    if (req.file) {
      // delete old local file (optional, safe)
      if (art.image && art.image.startsWith("/uploads/")) {
        const old = path.join(__dirname, "..", art.image);
        try { if (fs.existsSync(old)) fs.unlinkSync(old); } catch (e) { console.warn("Delete old image failed:", e.message); }
      }
      art.image = `/uploads/${req.file.filename}`;
    } else if (req.body.image) {
      art.image = req.body.image;
    }

    const updated = await art.save();
    res.json(updated);
  } catch (err) {
    console.error("Admin update artwork error:", err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE artwork (admin)
router.delete("/artworks/:id", protect, admin, async (req, res) => {
  try {
    const art = await Artwork.findById(req.params.id);
    if (!art) return res.status(404).json({ message: "Artwork not found" });

    // delete file if local
    if (art.image && art.image.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "..", art.image);
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) { console.warn("Delete file failed:", e.message); }
    }

    await art.deleteOne();
    res.json({ message: "Artwork deleted" });
  } catch (err) {
    console.error("Admin delete artwork error:", err);
    res.status(500).json({ message: err.message });
  }
});
// GET system settings (admin)
router.get("/settings", protect, admin, async (req, res) => {
  try {
    const settings = await SiteSettings.findOne(); // fetch first doc
    if (!settings) return res.status(404).json({ message: "Settings not found" });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// UPDATE system settings (admin)
router.put("/settings", protect, admin, async (req, res) => {
  try {
    const { siteName, siteDescription } = req.body; // example fields

    let settings = await SiteSettings.findOne();
    if (!settings) {
      // create new settings if none exist
      settings = await SiteSettings.create({ siteName, siteDescription });
    } else {
      settings.siteName = siteName || settings.siteName;
      settings.siteDescription = siteDescription || settings.siteDescription;
      await settings.save();
    }

    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/stats
router.get("/stats", protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalArtworks = await Artwork.countDocuments();

    // recent uploads (last 8)
    const recentUploads = await Artwork.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("uploadedBy", "name email")
      .lean();

    // category counts
    const categoryAgg = await Artwork.aggregate([
      { $group: { _id: { $ifNull: ["$category", "Uncategorized"] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const categories = categoryAgg.map((c) => ({ category: c._id, count: c.count }));

    // monthly counts for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyAgg = await Artwork.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // map aggregation to labels for last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 }); // month 1-12
    }

    const monthlyStats = months.map((m) => {
      const found = monthlyAgg.find((x) => x._id.year === m.year && x._id.month === m.month);
      return { label: `${m.year}-${String(m.month).padStart(2, "0")}`, count: found ? found.count : 0 };
    });

    res.json({
      totalUsers,
      totalArtworks,
      recentUploads,
      categories,
      monthlyStats,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
