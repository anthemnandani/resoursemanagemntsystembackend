const express = require('express');
const router = express.Router();
const upload = require("../config/multer");
const {
  createResource,
  getAllResources,
  getAvaliableResources,
  updateResource,
  deleteResource,
} = require("../controllers/resourceController");

router.post('/createresourse', createResource);
router.get('/', getAllResources);
router.get('/getAvaliableResources', getAvaliableResources);
router.put('/updateresourse/:id', updateResource);
router.delete('/deleteresourse/:id', deleteResource);

module.exports = router;