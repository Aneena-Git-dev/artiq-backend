const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware"); // your multer middleware
const { protect } = require("../middleware/authMiddleware");
const {
  uploadArtwork,
  getAllArtworks,
  getUserArtworks,
  getArtworkById,
  updateArtwork,
  deleteArtwork,
} = require("../controllers/artworkController");

// ✅ Upload artwork (protected)
router.post("/upload", protect, upload.single("image"), uploadArtwork);

// ✅ Get all artworks
router.get("/", getAllArtworks);

// ✅ Get artworks uploaded by logged-in user
router.get("/user/my-artworks", protect, getUserArtworks);

// ✅ Get single artwork
router.get("/:id", getArtworkById);

// ✅ Update artwork (owner only)
router.put("/:id", protect, upload.single("image"), updateArtwork);

// ✅ Delete artwork (owner only)
router.delete("/:id", protect, deleteArtwork);

module.exports = router;
