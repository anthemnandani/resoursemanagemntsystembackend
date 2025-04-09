const express = require('express');
const upload = require("../config/multer"); 
const {
  createResource,
  getAllResources,
  getAvaliableResources,
  updateResource,
  deleteResource,
} = require("../controllers/resourceController");

const router = express.Router();
router.post('/createresourse', upload.fields([
  { name: "images", maxCount: 5 },
  { name: "documents", maxCount: 5 }
])
, createResource);
router.get('/', getAllResources);
router.get('/getAvaliableResources', getAvaliableResources);
router.put('/updateresourse/:id', upload.fields([
  { name: "images", maxCount: 10 },
  { name: "documents", maxCount: 5 },
]), updateResource);
router.delete('/deleteresourse/:id', deleteResource);

module.exports = router;