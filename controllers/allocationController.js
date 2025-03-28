const Allocation = require('../models/allocation');
const Employee = require('../models/employee');
const Resource = require('../models/resource');

// Allocate Resource to Employee
const allocateResource = async (req, res) => {
  try {
    const { employeeId, resourceId } = req.body;
    
    // Check if employee exists and is active
    const employee = await Employee.findOne({ _id: employeeId, isDeleted: false });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found or inactive' });
    }

    // Check if resource exists
    const resource = await Resource.findOne({ _id: resourceId, isDeleted: false });
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found or inactive' });
    }
    
    // Check if resource exists and is available
    if (resource.status !== 'available') {
      return res.status(400).json({ error: 'Resource is not available for allocation' });
    }

    // Check if resource is already allocated to someone
    const existingAllocation = await Allocation.findOne({ 
      resource: resourceId, 
      status: 'active' 
    });
    if (existingAllocation) {
      return res.status(400).json({ error: 'Resource is already allocated to another employee' });
    }

    // Create new allocation
    const allocation = new Allocation({
      employee: employeeId,
      resource: resourceId
    });

    // Update resource status
    resource.status = 'allocated';
    await resource.save();
    
    await allocation.save();
    
    res.status(201).json(allocation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Return Resource
const returnResource = async (req, res) => {
  try {
    const { allocationId } = req.body;
    
    const allocation = await Allocation.findById(allocationId);
    if (!allocation || allocation.status === 'returned') {
      return res.status(404).json({ error: 'Allocation not found or already returned' });
    }

    // Update allocation
    allocation.status = 'returned';
    allocation.returnDate = Date.now();
    await allocation.save();

    // Update resource status
    const resource = await Resource.findById(allocation.resource);
    if (resource) {
      resource.status = 'available';
      await resource.save();
    }

    res.json({ message: 'Resource returned successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Allocations
const getAllAllocations = async (req, res) => {
  try {
    const allocations = await Allocation.find()
      .populate('employee', 'name email position department')
      .populate('resource', 'name type');
    
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Current Allocations (active)
const getCurrentAllocations = async (req, res) => {
  try {
    const allocations = await Allocation.find({ status: 'active' })
      .populate('employee', 'name email position department')
      .populate('resource', 'name type serialNumber');
    
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  allocateResource,
  returnResource,
  getAllAllocations,
  getCurrentAllocations
};