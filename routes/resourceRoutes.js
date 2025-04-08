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
router.post('/createresourse', upload.array("images", 10), createResource);
router.get('/', getAllResources);
router.get('/getAvaliableResources', getAvaliableResources);
router.put('/updateresourse/:id', updateResource);
router.delete('/deleteresourse/:id', deleteResource);

module.exports = router;