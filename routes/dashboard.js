const express = require("express");
const router = express.Router();
const Resource = require("../models/resource");
const ResourceType = require("../models/resourseType");
const Employee = require("../models/employee");
const Allocation = require("../models/allocation");

// GET /dashboard/summary
router.get("/", async (req, res) => {
  try {
    const [resourceCount, resourceTypeCount, employeeCount, allocationCount, allocations] =
      await Promise.all([
        Resource.countDocuments(),
        ResourceType.countDocuments(),
        Employee.countDocuments(),
        Allocation.countDocuments(),
      ]);

    res.status(200).json({
      success: true,
      message: "Dashboard summary fetched successfully",
      data: {
        resourceCount,
        resourceTypeCount,
        employeeCount,
        allocationCount,
      },
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard summary",
      error: error.message,
    });
  }
});

module.exports = router;