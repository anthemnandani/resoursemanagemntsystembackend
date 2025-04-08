const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

const uploadToCloudinary = (fileBuffer, folder, isVideo = false) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: isVideo ? "video" : "image", // Handle video or image
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

module.exports = { uploadToCloudinary };