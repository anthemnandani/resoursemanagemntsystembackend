const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");
const {
  createResource,
  getAllResources,
  updateResource,
  deleteResource,
} = require("../controllers/resourceController");

router.post(
  "/createresourse",
  createResource
);

router.get('/', getAllResources);
router.put(
  '/updateresourse/:id',
  updateResource
);
router.delete('/deleteresourse/:id', deleteResource);

module.exports = router;