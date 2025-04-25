const Allocation = require("../models/allocation");
const Employee = require("../models/employee");
const Resource = require("../models/resource");

// Allocate Resource to Employee
const allocateResource = async (req, res) => {
  try {
    const { employeeId, resourceId, AllocatedDate } = req.body;

    // Check if employee exists and is Active
    const employee = await Employee.findOne({
      _id: employeeId,
      isDeleted: false,
    });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found or Inactive" });
    }

    // Check if resource exists
    const resource = await Resource.findOne({
      _id: resourceId,
      isDeleted: false,
    });
    if (!resource) {
      return res.status(404).json({ error: "Resource not found or Inactive" });
    }

    // Check if resource is Available
    if (
      resource.status !== "Available" ||
      resource.avaliableResourceCount === 0
    ) {
      return res
        .status(400)
        .json({ error: "No Available resources for allocation" });
    }

    const existingAllocation = await Allocation.findOne({
      employee: employeeId,
      resource: resourceId,
      returnDate: { $exists: false }, // Ensuring it's still allocated
    });

    if (existingAllocation) {
      return res
        .status(400)
        .json({ error: "Resource is already allocated to this employee" });
    }

    // Create new allocation
    const allocation = new Allocation({
      employee: employeeId,
      resource: resourceId,
      AllocatedDate: AllocatedDate,
    });

    // Update resource status and count
    resource.avaliableResourceCount = Math.max(
      resource.avaliableResourceCount - 1,
      0
    );

    // If no resources left, mark as Allocated
    if (resource.avaliableResourceCount === 0) {
      resource.status = "Allocated";
    }

    await resource.save();
    await allocation.save();

    res.status(201).json({
      success: true,
      message: "Resource Allocated successfully",
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

    // Check if allocation exists and is Active
    const allocation = await Allocation.findById(allocationId);
    if (!allocation || allocation.status === "Returned") {
      return res
        .status(404)
        .json({ error: "Allocation not found or already Returned" });
    }

    // Update allocation status
    allocation.status = "Returned";
    allocation.returnDate = Date.now();
    await allocation.save();

    // Update resource status and count
    const resource = await Resource.findById(allocation.resource);
    if (resource) {
      resource.avaliableResourceCount = Math.min(
        resource.avaliableResourceCount + 1,
        resource.totalResourceCount
      );

      // If at least one resource is Available, update status
      if (resource.avaliableResourceCount > 0) {
        resource.status = "Available";
      }

      await resource.save();
    }

    res.json({
      success: true,
      message: "Resource Returned successfully",
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
    .populate({
      path: "resource",
      populate: {
        path: "resourceType",
        select: "name"
      }
    });
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

    const allocations = await Allocation.find({
      employee: employeeId,
      status: { $ne: "Returned" },
    })
      .populate({
        path: "resource",
        populate: {
          path: "resourceType",
          model: "ResourceType",
        },
      })
      .sort({ AllocatedDate: -1 });

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
        resourceType: allocation.resource?.resourceType?.name || "N/A",
        resourceId: allocation.resource?._id || null,
        description: allocation.resource?.description || "",
        allocationDate: allocation.AllocatedDate,
        returnDate: allocation.returnDate,
        status: allocation.status,
      })),
    });
  } catch (error) {
    console.error("Error fetching employee allocations:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getResourceAllocations = async (req, res) => {
  try {
    const { resourceId } = req.params;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    const allocations = await Allocation.find({
      resource: resourceId,
      status: { $ne: "Returned" },
    })
      .populate("employee") // Get employee details
      .sort({ AllocatedDate: -1 });

    res.json({
      success: true,
      resource: {
        id: resource._id,
        name: resource.name,
        type: resource.resourceType,
      },
      totalAllocations: allocations.length,
      allocations: allocations.map((allocation) => ({
        employeeId: allocation.employee?._id || null,
        employeeName: allocation.employee?.name || "N/A",
        employeePosition: allocation.employee?.position || "N/A",
        allocationDate: allocation.AllocatedDate,
        returnDate: allocation.returnDate,
        status: allocation.status,
      })),
    });
  } catch (error) {
    console.error("Error fetching resource allocations:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get Current Allocations (Active)
const getCurrentAllocations = async (req, res) => {
  try {
    const allocations = await Allocation.find({ status: "Active" })
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
  getResourceAllocations,
  getCurrentAllocations,
};
