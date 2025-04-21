const express = require('express');
const router = express.Router();
const allocationController = require('../controllers/allocationController');

router.post('/allocate', allocationController.allocateResource);
router.delete('/return/:allocationId', allocationController.returnResource);
router.get('/', allocationController.getAllAllocations);
router.get('/employee/:employeeId', allocationController.getEmployeeAllocations);
router.get('/resource/:resourceId', allocationController.getResourceAllocations);
router.get('/current', allocationController.getCurrentAllocations);

module.exports = router;