const Resource = require('../models/resource');
const Allocation = require('../models/allocation');
const ResourceType = require('../models/resourseType');

const createResource = async (req, res) => {
  try {
    const { name, resourceTypeId, description, purchaseDate, status } = req.body;

    if (!name || !resourceTypeId) {
      return res.status(400).json({
        success: false,
        error: 'Name and resource type are required'
      });
    }

    // Handle file upload to Cloudinary if images are avaliable
    // let imageUploads = [];
    // if (req.files?.images) {
    //   try {
    //     imageUploads = await Promise.all(
    //       req.files.images.map(file => {
    //         return new Promise((resolve, reject) => {
    //           const uploadStream = cloudinary.uploader.upload_stream(
    //             {
    //               folder: "resources",
    //               resource_type: 'auto',
    //             },
    //             (error, result) => {
    //               if (error) reject(error);
    //               else resolve({
    //                 url: result.secure_url,
    //                 public_id: result.public_id
    //               });
    //             }
    //           );

    //           const bufferStream = require('stream').Readable.from(file.data);
    //           bufferStream.pipe(uploadStream);
    //         });
    //       })
    //     );
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
      // images: imageUploads,
    });

    await resource.save();

    // Populate the resourceType name for the response
    const createdResource = await Resource.findById(resource._id)
      .populate('resourceType', 'name');

    res.status(201).json({
      success: true,
      message: "Resource created successfully",
      data: createdResource
    });

  } catch (error) {
    console.error('Resource creation error:', error);

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
      .populate('resourceType', 'name') // Only populate the name field
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
    const { name, resourceTypeId, description, purchaseDate, status } = req.body;
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

    // Update resource fields
    resource.name = name;
    resource.resourceType = resourceTypeId;
    resource.description = description || undefined;
    resource.purchaseDate = purchaseDate || resource.purchaseDate;
    resource.status = status || resource.status;

    // Handle image updates if files are included
    // if (req.files?.images) {
    //   try {
    //     const imageUploads = await Promise.all(
    //       req.files.images.map(file => {
    //         return new Promise((resolve, reject) => {
    //           const uploadStream = cloudinary.uploader.upload_stream(
    //             {
    //               folder: "resources",
    //               resource_type: 'auto',
    //             },
    //             (error, result) => {
    //               if (error) reject(error);
    //               else resolve({
    //                 url: result.secure_url,
    //                 public_id: result.public_id
    //               });
    //             }
    //           );
    //           const bufferStream = require('stream').Readable.from(file.data);
    //           bufferStream.pipe(uploadStream);
    //         });
    //       })
    //     );
    //     resource.images = [...resource.images, ...imageUploads];
    //   } catch (uploadError) {
    //     console.error('Image upload failed:', uploadError);
    //     return res.status(500).json({
    //       success: false,
    //       error: 'Failed to upload images'
    //     });
    //   }
    // }

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
  getAllResources,
  updateResource,
  deleteResource
};