// routes/resourceTypeRoutes.js
const express = require('express');
const {
  createResourceType,
  getResourceTypes,
  getResourceType,
  updateResourceType,
  deleteResourceType
} = require('../controllers/resoursetypeController');

const router = express.Router();

router.route('/')
  .post(createResourceType)
  .get(getResourceTypes);

router.route('/:id')
  .put(updateResourceType)
  .delete(deleteResourceType);

module.exports = router;