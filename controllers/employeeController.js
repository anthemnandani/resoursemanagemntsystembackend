const cloudinary = require('../utils/cloudnery');
const Employee = require('../models/employee');
// const Resource = require('../models/resource');
const Allocation = require('../models/allocation');

// Create Employee
const createEmployee = async (req, res) => {
  try {
    let profilePictureUrl = 'https://res.cloudinary.com/dmyq2ymj9/image/upload/v1742973540/employee_profiles/gifynr23tzunvk3g9pzk.png';
    
    if (req.files?.profilePicture) {
      try {
        const file = req.files.profilePicture;
        
        // Check file size (5MB limit example)
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_FILE_SIZE) {
          return res.status(400).json({
            success: false,
            error: 'File size too large',
            message: 'Maximum allowed size is 5MB'
          });
        }
    
        // Convert buffer to stream and upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "employee_profiles",
              width: 500,
              height: 500,
              crop: "fill"
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          
          const bufferStream = new require('stream').Readable();
          bufferStream.push(file.data);
          bufferStream.push(null);
          bufferStream.pipe(uploadStream);
        });
    
        profilePictureUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Profile picture upload failed:', uploadError);
        
        let errorMessage = 'Failed to upload profile picture';
        if (uploadError.message.includes('File size too large')) {
          errorMessage = 'File size exceeds Cloudinary limits';
        }
        
        return res.status(500).json({
          success: false,
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? uploadError.message : undefined
        });
      }
    }

    const { name, email, position, department } = req.body;
    
    // Validate required fields
    if (!name || !email || !position || !department) {
      return res.status(400).json({ 
        success: false,
        error: 'All fields are required' 
      });
    }

    // Check for existing employee
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ 
        success: false,
        error: 'Employee with this email already exists' 
      });
    }

    // Create new employee
    const employee = new Employee({
      name,
      email,
      position,
      department,
      profilePicture: profilePictureUrl,
      status: 'active'
    });

    await employee.save();

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employee
    });

  } catch (error) {
    console.error('Employee creation error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get All Employees
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Single Employee
const getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee || employee.isDeleted) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Employee
const updateEmployee = async (req, res) => {
  try {
    const { name, position, department, status } = req.body;
    const employee = await Employee.findById(req.params.id);
    
    if (!employee || employee.isDeleted) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Handle file upload if a new profile picture was provided
    if (req.files?.profilePicture) {
      try {
        const file = req.files.profilePicture;
        
        // Convert buffer to stream and upload directly to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "employee_profiles",
              width: 500,
              height: 500,
              crop: "fill"
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          
          // Create stream from buffer and pipe to Cloudinary
          const bufferStream = new require('stream').Readable();
          bufferStream.push(file.data);
          bufferStream.push(null);
          bufferStream.pipe(uploadStream);
        });

        employee.profilePicture = result.secure_url;
      } catch (uploadError) {
        console.error('Profile picture upload failed:', uploadError);
      }
    }

    employee.name = name || employee.name;
    employee.position = position || employee.position;
    employee.department = department || employee.department;
    employee.status = status || employee.status;

    await employee.save();
    
    res.json({
      success: true,
      message: "Employee updated successfully",
      data: employee
    });
  } catch (error) {
    console.error('Employee update error:', error);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Soft Delete Employee
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee || employee.isDeleted) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    employee.isDeleted = true;
    employee.status = 'inactive';
    await employee.save();
    
    // Also deallocate any resources
    await Allocation.updateMany(
      { employee: employee._id, status: 'active' },
      { status: 'returned', returnDate: Date.now() }
    );

    res.json({ message: 'Employee deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee
};