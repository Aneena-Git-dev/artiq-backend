// models/user.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
  
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: { type: String, required: [true, "Password is required"], minlength: 6 },
    isAdmin: { type: Boolean, default: false },
        role: {
      type: String,
      enum: ["user", "admin"],
      default: "user", // most users are normal users
    },

    // new fields
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    profileImage: { type: String, default: "" }, // store path like /uploads/xxx.jpg or full URL
      artworks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artwork"
    
    }]
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.checkPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
