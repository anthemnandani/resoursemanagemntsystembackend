const {uploadToCloudinary} = require('../utils/uploadToCloudinary');
const Employee = require('../models/employee');
// const Resource = require('../models/resource');
const Allocation = require('../models/allocation');

const createEmployee = async (req, res) => {
  try {
    let profilePicture = {
      url: 'https://res.cloudinary.com/dmyq2ymj9/image/upload/v1742888485/4288270_nuia5s.png',
      public_id: ''
    };

    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, "employee/profilePicture");
        profilePicture = {
          url: result.secure_url,
          public_id: result.public_id
        };
      } catch (uploadError) {
        console.error('Profile picture upload failed:', uploadError);
        return res.status(500).json({
          success: false,
          error: uploadError.message.includes('File size too large')
            ? 'File size exceeds Cloudinary limits'
            : 'Failed to upload profile picture'
        });
      }
    }

    const { name, email, position, department } = req.body;

    if (!name || !email || !position || !department) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ success: false, error: 'Employee with this email already exists' });
    }

    const employee = new Employee({
      name,
      email,
      position,
      department,
      profilePicture,
      status: 'Active'
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
    const employeesWithAllocations = await Promise.all(
      employees.map(async (employee) => {
        const allocationCount = await Allocation.countDocuments({ employee: employee._id });
        return {
          ...employee.toObject(),
          allocatedResourceCount: allocationCount,
        };
      })
    );

    res.json(employeesWithAllocations);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: "Internal server error" });
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

    // Handle new profile picture upload
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, "employee/profilePicture");

        // Optionally: delete the old image from Cloudinary using employee.profilePicture.public_id

        employee.profilePicture = {
          url: result.secure_url,
          public_id: result.public_id
        };
      } catch (uploadError) {
        console.error('Profile picture upload failed:', uploadError);
        return res.status(500).json({
          success: false,
          error: uploadError.message.includes('File size too large')
            ? 'File size exceeds Cloudinary limits'
            : 'Failed to upload new profile picture'
        });
      }
    }

    // Update basic fields
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
    employee.status = 'Inactive';
    await employee.save();
    
    // Also deallocate any resources
    await Allocation.updateMany(
      { employee: employee._id, status: 'Active' },
      { status: 'Returned', returnDate: Date.now() }
    );

    res.json({ message: 'Employee deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createEmployee,
  getAllEmployees,
  updateEmployee,
  deleteEmployee
};