const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// Routes
router.post('/createemployee', employeeController.createEmployee);
router.get('/', employeeController.getAllEmployees);
router.get('/getAllActiveEmployees', employeeController.getAllActiveEmployees);
router.get('/:id', employeeController.getEmployee);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;