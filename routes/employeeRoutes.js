const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const upload = require("../config/multer");

// Routes
router.post('/createemployee', upload.single('profilePicture'), employeeController.createEmployee);
router.get('/', employeeController.getAllEmployees);
router.put('/:id', upload.single('profilePicture'), employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;