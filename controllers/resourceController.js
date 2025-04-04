const Resource = require('../models/resource');
const Allocation = require('../models/allocation');
const ResourceType = require('../models/resourseType');
const { uploadToCloudinary } = require("../utils/uploadToCloudinary");
const cloudinary = require('cloudinary').v2;

const createResource = async (req, res) => {
  try {
    const { name, resourceTypeId, description, purchaseDate, status, totalResourceCount, avaliableResourceCount } = req.body;

    if (!name || !resourceTypeId) {
      return res.status(400).json({
        success: false,
        error: 'Name and resource type are required'
      });
    }

    // let imageUploads = [];

    // // Check if files exist
    // if (!req.files || req.files.length === 0) {
    //   console.log('No files received for upload');
    // } else {
    //   console.log(`Received ${req.files.length} files for upload`);

    //   try {
    //     // Upload images to Cloudinary
    //     imageUploads = await Promise.allSettled(
    //       req.files.map(file => uploadToCloudinary(file.buffer))
    //     );

    //     // Filter successful uploads
    //     imageUploads = imageUploads
    //       .filter(result => result.status === 'fulfilled')
    //       .map(result => result.value);
    //   } catch (uploadError) {
    //     console.error('Image upload failed:', uploadError);
    //     return res.status(500).json({
    //       success: false,
    //       error: 'Failed to upload images'
    //     });
    //   }
    // }

    const resource = new Resource({
      name,
      resourceType: resourceTypeId,
      description: description || undefined,
      purchaseDate: purchaseDate || new Date(),
      status: status || 'available',
      totalResourceCount: totalResourceCount || 1,
      avaliableResourceCount: avaliableResourceCount || 1,
      // images: imageUploads.length > 0 ? imageUploads : [],
    });

    await resource.save();

    const createdResource = await Resource.findById(resource._id)
      .populate('resourceType', 'name');

    res.status(201).json({
      success: true,
      message: "Resource created successfully",
      data: createdResource
    });

  } catch (error) {
    console.error('Resource creation error:', error.message);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Resource with this name already exists'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error'
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
    const resources = await Resource.find({isDeleted:false, status:'available'})
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
    if (!name || !resourceTypeId) {
      return res.status(400).json({
        success: false,
        error: 'Name and resource type are required'
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

    // Update available resource count logic
    if (avaliableResourceCount !== undefined) {
      resource.avaliableResourceCount = Math.min(avaliableResourceCount, resource.totalResourceCount);
    }

    // Handle resource allocation logic
    if (status === "allocated") {
      resource.avaliableResourceCount = Math.max(resource.avaliableResourceCount - 1, 0);
    } else if (status === "available") {
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
    
    // Also deallocate if currently allocated
    await Allocation.updateMany(
      { resource: resource._id, status: 'active' },
      { status: 'returned', returnDate: Date.now() }
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