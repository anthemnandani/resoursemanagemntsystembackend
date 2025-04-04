const Allocation = require("../models/allocation");
const Employee = require("../models/employee");
const Resource = require("../models/resource");

// Allocate Resource to Employee
const allocateResource = async (req, res) => {
  try {
    const { employeeId, resourceId, allocatedDate } = req.body;

    // Check if employee exists and is active
    const employee = await Employee.findOne({
      _id: employeeId,
      isDeleted: false,
    });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found or inactive" });
    }

    // Check if resource exists
    const resource = await Resource.findOne({
      _id: resourceId,
      isDeleted: false,
    });
    if (!resource) {
      return res.status(404).json({ error: "Resource not found or inactive" });
    }

    // Check if resource is available
    if (
      resource.status !== "available" ||
      resource.avaliableResourceCount === 0
    ) {
      return res
        .status(400)
        .json({ error: "No available resources for allocation" });
    }

    // Create new allocation
    const allocation = new Allocation({
      employee: employeeId,
      resource: resourceId,
      allocatedDate: allocatedDate,
    });

    // Update resource status and count
    resource.avaliableResourceCount = Math.max(
      resource.avaliableResourceCount - 1,
      0
    );

    // If no resources left, mark as allocated
    if (resource.avaliableResourceCount === 0) {
      resource.status = "allocated";
    }

    await resource.save();
    await allocation.save();

    res.status(201).json({
      success: true,
      message: "Resource allocated successfully",
      allocation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const returnResource = async (req, res) => {
  try {
    const { allocationId } = req.params;
    console.log("allocation id is: ", allocationId);

    // Check if allocation exists and is active
    const allocation = await Allocation.findById(allocationId);
    if (!allocation || allocation.status === "returned") {
      return res
        .status(404)
        .json({ error: "Allocation not found or already returned" });
    }

    // Update allocation status
    allocation.status = "returned";
    allocation.returnDate = Date.now();
    await allocation.save();

    // Update resource status and count
    const resource = await Resource.findById(allocation.resource);
    if (resource) {
      resource.avaliableResourceCount = Math.min(
        resource.avaliableResourceCount + 1,
        resource.totalResourceCount
      );

      // If at least one resource is available, update status
      if (resource.avaliableResourceCount > 0) {
        resource.status = "available";
      }

      await resource.save();
    }

    res.json({
      success: true,
      message: "Resource returned successfully",
      allocation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Allocations
const getAllAllocations = async (req, res) => {
  try {
    const allocations = await Allocation.find()
      .populate("employee", "name email position department")
      .populate("resource", "name type");

    res.json(allocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getEmployeeAllocations = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const allocations = await Allocation.find({ employee: employeeId })
      .populate({
        path: "resource",
        populate: {
          path: "resourceType", 
          model: "ResourceType", 
        },
      })
      .sort({ allocatedDate: -1 });

    res.json({
      success: true,
      employee: {
        id: employee._id,
        name: employee.name,
        position: employee.position,
      },
      totalAllocations: allocations.length,
      allocations: allocations.map((allocation) => ({
        resourceName: allocation.resource?.name || "N/A",
        resourceType: allocation.resource?.resourceType?.name || "N/A", // Fetch actual resource type name
        resourceId: allocation.resource?._id || null,
        description: allocation.resource?.description || "",
        allocationDate: allocation.allocatedDate,
        returnDate: allocation.returnDate,
        status: allocation.status,
      })),
    });
  } catch (error) {
    console.error("Error fetching employee allocations:", error);
    res.status(500).json({ error: "Server error" });
  }
};


// Get Current Allocations (active)
const getCurrentAllocations = async (req, res) => {
  try {
    const allocations = await Allocation.find({ status: "active" })
      .populate("employee", "name email position department")
      .populate("resource", "name type serialNumber");

    res.json(allocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  allocateResource,
  returnResource,
  getAllAllocations,
  getEmployeeAllocations,
  getCurrentAllocations,
};
