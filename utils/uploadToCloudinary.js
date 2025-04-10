const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

const uploadToCloudinary = (fileBuffer, folder, resourceType = "auto", originalname = "") => {
  return new Promise((resolve, reject) => {
    const tempPath = path.join(__dirname, `../temp/${Date.now()}-${originalname}`);
    fs.writeFileSync(tempPath, fileBuffer); // Save file temporarily

    cloudinary.uploader.upload(
      tempPath,
      {
        folder,
        resource_type: resourceType,
        public_id: originalname.replace(/\s+/g, "_"),
        use_filename: true,
        unique_filename: false,
        overwrite: true,
      },
      (error, result) => {
        fs.unlinkSync(tempPath); // Clean up temp file
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
};

module.exports = { uploadToCloudinary };