const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
dotenv.config();

const cloudinaryConnection = async () => {
  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new Error("Missing Cloudinary environment variables");
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log("Cloudinary connected successfully");
  } catch (error) {
    console.error("Error connecting to Cloudinary:", error.message);
    throw new Error("Cloudinary connection failed");
  }
};

module.exports = cloudinaryConnection;