const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");
const {
  createResource,
  getResource,
  getAllResources,
  updateResource,
  deleteResource,
} = require("../controllers/resourceController");

router.post(
  "/createresourse",
  upload.fields([
    { name: "images", maxCount: 10 },
  ]),
  createResource
);

router.get('/', getAllResources);
router.get('/:id', getResource);
router.put(
  '/updateresourse/:id',
  upload.fields([
    { name: "images", maxCount: 10 },
  ]),
  updateResource
);
router.delete('/deleteresourse/:id', deleteResource);

module.exports = router;