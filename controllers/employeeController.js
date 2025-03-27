const cloudinary = require('../utils/cloudnery');
const Employee = require('../models/employee');
// const Resource = require('../models/resource');
const Allocation = require('../models/allocation');

// Create Employee
const createEmployee = async (req, res) => {
  try {
    // console.log('Request body:', req.body);
    // console.log('Request files:', req.files);

    // default profile pic if not present
    let profilePictureUrl = 'https://res.cloudinary.com/dmyq2ymj9/image/upload/v1742876979/samples/woman-on-a-football-field.jpg';
    
    if (req.files?.profilePicture) {  // Changed from req.file to req.files
      try {
        const file = req.files.profilePicture;
        
        // Upload to Cloudinary using temp file path
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: "employee_profiles",
          width: 500,
          height: 500,
          crop: "fill"
        });

        profilePictureUrl = result.secure_url;
        // console.log('Uploaded profile picture url:', profilePictureUrl);
      } catch (uploadError) {
        console.error('Profile picture upload failed:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload profile picture',
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

    // Checking for existing employee
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ 
        success: false,
        error: 'Employee with this email already exists' 
      });
    }

    // createing new employee
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

// Get All Employees (excluding deleted)
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ isDeleted: false });
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
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: "employee_profiles",
          width: 500,
          height: 500,
          crop: "fill"
        });

        if (result?.secure_url) {
          employee.profilePicture = result.secure_url;
        } else {
          console.error('Cloudinary upload failed - no URL returned');
        }
      } catch (uploadError) {
        console.error('Profile picture upload failed:', uploadError);
        // Continue with other updates even if image upload fails
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