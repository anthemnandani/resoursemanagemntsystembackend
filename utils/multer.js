const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Validate file types
  const allowedTypes = [
    'image/jpeg', 
    'image/png', 
    'image/jpg',
    'image/webp',
    'image/gif'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, jpg, PNG and webp images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, 
    files: 10 
  }
});

module.exports = upload;