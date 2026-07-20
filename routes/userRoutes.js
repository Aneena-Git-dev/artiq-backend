// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware/authMiddleware");
const {
  registerUser,
  loginUser,
  getMe,
  updateUser,
} = require("../controllers/userController");

router.post("/register", registerUser);
router.post("/login", loginUser);

// protected routes
router.get("/me", protect, getMe);
router.put("/update", protect, (req, res, next) => {
  upload.single("profileImage")(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, updateUser);


module.exports = router;
