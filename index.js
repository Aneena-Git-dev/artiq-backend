// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 4000;
const adminRoutes = require('./routes/adminRoutes');


// -------------------- MIDDLEWARES --------------------



// Enable CORS for production and development environments
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://artiq-frontend.vercel.app",
    ],
    credentials: true,
  })
);

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder as static so images are accessible
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// -------------------- ROUTES --------------------



app.get("/test", (req, res) => {
  res.json({
    status: "Backend is working!",
    time: new Date()
  });
});
// Sample route
app.get('/', (req, res) => {
  res.send('Welcome to Artiq Backend');
});

// Import route files
const userRoutes = require('./routes/userRoutes');
const artworkRoutes = require('./routes/artworkRoutes');

// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/artworks', artworkRoutes);

// Mount admin routes
app.use("/api/admin", adminRoutes);

// -------------------- DATABASE CONNECTION --------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// -------------------- ERROR HANDLING --------------------

// Catch all 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});
