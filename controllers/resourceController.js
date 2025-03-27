const Resource = require('../models/resource');
const Allocation = require('../models/allocation');
const cloudinary  = require("../utils/cloudnery");

// Create Resource
const createResource = async (req, res) => {
  try {
    const { name, type, customType, description, purchaseDate, status } = req.body;
    
    // Validate required fields
    if (!name || !type || (type === 'other' && !customType)) {
      return res.status(400).json({
        success: false,
        error: 'Required fields are missing'
      });
    }
    11
    let imageUploads = [];
    if (req.files?.images) {
      try {
        // Upload all images in parallel
        imageUploads = await Promise.all(
          req.files.images.map(file => {
            return new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                {
                  folder: "resources",
                  resource_type: 'auto'
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve({
                    url: result.secure_url,
                    public_id: result.public_id
                  });
                }
              );
              
              // Convert buffer to stream and upload directly
              const bufferStream = require('stream').Readable.from(file.buffer);
              bufferStream.pipe(uploadStream);
            });
          })
        );
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload images'
        });
      }
    }

    // Create new resource (serialNumber will auto-increment)
    const resource = new Resource({
      name,
      type,
      customType: type === 'other' ? customType : undefined,
      description: description || undefined,
      purchaseDate: purchaseDate || new Date(),
      status: status || 'available',
      images: imageUploads
    });

    await resource.save();

    res.status(201).json({
      success: true,
      message: "Resource created successfully",
      data: resource
    });

  } catch (error) {
    console.error('Resource creation error:', error);
    
    // Handle duplicate key error (shouldn't happen with auto-increment)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Resource with this serial number already exists'
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => err.message)
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
    const resources = await Resource.find({ isDeleted: false });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Single Resource
const getResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource || resource.isDeleted) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json(resource);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Resource
const updateResource = async (req, res) => {
  try {
    const { name, type, customType, description, serialNumber, status } = req.body;
    const resource = await Resource.findById(req.params.id);
    
    if (!resource || resource.isDeleted) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Validate customType when type is 'other'
    if (type === 'other' && !customType) {
      return res.status(400).json({ error: 'Custom type is required when selecting "other"' });
    }

    resource.name = name || resource.name;
    resource.type = type || resource.type;
    resource.description = description || resource.description;
    resource.serialNumber = serialNumber || resource.serialNumber;
    resource.status = status || resource.status;
    
    // Only update customType if type is 'other'
    if (type === 'other') {
      resource.customType = customType;
    } else {
      resource.customType = undefined;
    }

    // Handle image updates if files are included
    if (req.files?.images) {
      const images = await Promise.all(
        req.files.images.map((file) =>
          cloudinary(file.buffer, "resources/images")
        )
      );
      resource.images = [
        ...resource.images,
        ...images.map((img) => ({
          url: img.secure_url,
          public_id: img.public_id,
        }))
      ];
    }

    await resource.save();
    res.json(resource);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    resource.status = 'maintenance';
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
  getResource,
  updateResource,
  deleteResource
};