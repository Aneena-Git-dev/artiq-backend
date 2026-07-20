const jwt = require("jsonwebtoken");
const User = require("../models/user");

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Not authorized" });
  }
};

// Admin check: allow if user.role === 'admin' OR user.isAdmin true
exports.admin = (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });
    if (req.user.role === "admin" || req.user.isAdmin) {
      return next();
    }
    return res.status(403).json({ message: "Not authorized as admin" });
  } catch (err) {
    console.error("Admin middleware error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
