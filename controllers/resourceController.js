const Resource = require('../models/resource');
const Allocation = require('../models/allocation');
const ResourceType = require('../models/resourseType');
const { uploadToCloudinary } = require("../utils/uploadToCloudinary");

const createResource = async (req, res) => {
  try {
    const {
      name,
      resourceTypeId,
      description,
      purchaseDate,
      status,
      totalResourceCount,
      avaliableResourceCount,
    } = req.body;

    if (!name || !resourceTypeId || !description) {
      return res.status(400).json({
        success: false,
        error: "Name, description and resource type are required",
      });
    }

    if (description.length > 500) {
      return res.status(400).json({
        success: false,
        error: "Description cannot exceed 500 characters",
      });
    }

    // Check if images are present
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one image is required",
      });
    }

    // Upload images to Cloudinary
    const images = await Promise.all(
      req.files.map((file) => uploadToCloudinary(file.buffer, "resources/images"))
    );

    // Map to include secure_url and public_id
    const imageUrls = images.map((img) => ({
      url: img.secure_url,
      public_id: img.public_id,
    }));

    const resource = new Resource({
      name,
      resourceType: resourceTypeId,
      description,
      purchaseDate: purchaseDate || new Date(),
      status: status || "Available",
      totalResourceCount: totalResourceCount || 1,
      avaliableResourceCount: avaliableResourceCount || 1,
      images: imageUrls, // Must exist in schema
    });

    await resource.save();

    const createdResource = await Resource.findById(resource._id).populate(
      "resourceType",
      "name"
    );

    res.status(201).json({
      success: true,
      message: "Resource created successfully",
      data: createdResource,
    });
  } catch (error) {
    console.error("Resource creation error:", error.message);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Resource with this name already exists",
      });
    }
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Get All Resources (excluding deleted)
const getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find({isDeleted:false})
      .populate('resourceType', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: resources
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};


// Get All avaliable Resources
const getAvaliableResources = async (req, res) => {
  try {
    const resources = await Resource.find({isDeleted:false, status:'Available'})
      .populate('resourceType', 'name') 
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: resources
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Update Resource
const updateResource = async (req, res) => {
  try {
    const { 
      name, 
      resourceTypeId, 
      description, 
      purchaseDate, 
      status, 
      totalResourceCount, 
      avaliableResourceCount 
    } = req.body;

    const resource = await Resource.findById(req.params.id);

    if (!resource || resource.isDeleted) {
      return res.status(404).json({ 
        success: false,
        error: 'Resource not found' 
      });
    }

    // Validate required fields
    if (!name || !resourceTypeId || !description) {
      return res.status(400).json({
        success: false,
        error: 'Name, description and resource type are required'
      });
    }

    if (description.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Description cannot exceed 500 characters'
      });
    }

    // Check if resource type exists
    const typeExists = await ResourceType.findById(resourceTypeId);
    if (!typeExists) {
      return res.status(400).json({
        success: false,
        error: 'Invalid resource type'
      });
    }

    // Update fields
    resource.name = name;
    resource.resourceType = resourceTypeId;
    resource.description = description || undefined;
    resource.purchaseDate = purchaseDate || resource.purchaseDate;
    resource.status = status || resource.status;

    // Update totalResourceCount if provided
    if (totalResourceCount !== undefined) {
      resource.totalResourceCount = totalResourceCount;
    }

    // Update Available resource count logic
    if (avaliableResourceCount !== undefined) {
      resource.avaliableResourceCount = Math.min(avaliableResourceCount, resource.totalResourceCount);
    }

    // Handle resource allocation logic
    if (status === "Allocated") {
      resource.avaliableResourceCount = Math.max(resource.avaliableResourceCount - 1, 0);
    } else if (status === "Available") {
      resource.avaliableResourceCount = Math.min(resource.avaliableResourceCount + 1, resource.totalResourceCount);
    }

    await resource.save();

    // Populate the resourceType name for the response
    const updatedResource = await Resource.findById(resource._id)
      .populate('resourceType', 'name');

    res.json({
      success: true,
      message: "Resource updated successfully",
      data: updatedResource
    });

  } catch (error) {
    console.error('Resource update error:', error);
    
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


// Soft Delete Resource
const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource || resource.isDeleted) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    resource.isDeleted = true;
    await resource.save();
    
    // Also deallocate if currently Allocated
    await Allocation.updateMany(
      { resource: resource._id, status: 'Active' },
      { status: 'Returned', returnDate: Date.now() }
    );

    res.json({ message: 'Resource deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createResource,
  getAvaliableResources,
  getAllResources,
  updateResource,
  deleteResource
};