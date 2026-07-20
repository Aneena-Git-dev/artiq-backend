const mongoose = require("mongoose");

const siteSettingsSchema = new mongoose.Schema(
  {
    siteTitle: { type: String, default: "My Digital Art Gallery" },
    siteDescription: { type: String, default: "A place to showcase and sell digital art." },
    adminEmail: { type: String, default: "admin@example.com" },
    logo: { type: String, default: "" }, // can store URL or file path
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);
