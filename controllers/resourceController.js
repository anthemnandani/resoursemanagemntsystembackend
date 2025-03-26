const Resource = require('../models/resource');
const Allocation = require('../models/allocation');
const cloudinary  = require("../utils/cloudnery");

// Create Resource
const createResource = async (req, res) => {
  try {
    console.log('[DEBUG] Request received - headers:', req.headers);
    console.log('[DEBUG] Request body:', req.body);
    console.log('[DEBUG] Request files:', req.files);

    // Verify Cloudinary configuration
    console.log('[DEBUG] Cloudinary config:', {
      cloud_name: cloudinary.config().cloud_name,
      api_key: cloudinary.config().api_key ? '***REDACTED***' : 'MISSING'
    });

    const { name, type, customType, description, serialNumber } = req.body;

    // Validate required fields with more detailed errors
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!type) missingFields.push('type');
    if (!serialNumber) missingFields.push('serialNumber');
    
    if (missingFields.length > 0) {
      console.log('[VALIDATION ERROR] Missing fields:', missingFields);
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields',
        missingFields
      });
    }

    // Default image configuration
    const defaultImage = {
      url: 'https://res.cloudinary.com/dmyq2ymj9/image/upload/v1742876979/samples/computer.jpg',
      public_id: 'default_resource'
    };
    let images = [defaultImage];
    
    // Handle image upload if present
    if (req.files?.image) {
      try {
        console.log('[DEBUG] Processing image upload...');
        const file = req.files.image;
        
        // Verify file properties
        console.log('[DEBUG] File details:', {
          name: file.name,
          size: file.size,
          mimetype: file.mimetype,
          tempFilePath: file.tempFilePath
        });

        if (!file.tempFilePath) {
          throw new Error('No temp file path available');
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: "resources",
          width: 800,
          height: 600,
          crop: "fill",
          timeout: 30000 // 30 seconds timeout
        });

        if (!result?.secure_url) {
          throw new Error('Cloudinary upload failed - no URL returned');
        }

        console.log('[DEBUG] Cloudinary upload success:', {
          url: result.secure_url,
          size: result.bytes,
          format: result.format
        });

        images = [{
          url: result.secure_url,
          public_id: result.public_id
        }];
      } catch (uploadError) {
        console.error('[UPLOAD ERROR] Failed to upload image:', {
          message: uploadError.message,
          stack: uploadError.stack,
          code: uploadError.code
        });
        // Continue with default image but log warning
        console.warn('[FALLBACK] Using default image due to upload failure');
      }
    }

    // Check for existing resource with more detailed query
    const existingResource = await Resource.findOne({ serialNumber }).lean();
    if (existingResource) {
      console.log('[CONFLICT] Duplicate serial number:', serialNumber);
      return res.status(400).json({ 
        success: false,
        error: 'Serial number already exists',
        conflictingId: existingResource._id
      });
    }

    // Create new resource with transaction for safety
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const resource = new Resource({
        name,
        type,
        ...(type === 'other' && { customType }),
        description,
        serialNumber,
        images
      });

      await resource.save({ session });
      await session.commitTransaction();
      
      console.log('[SUCCESS] Resource created:', resource._id);

      res.status(201).json({
        success: true,
        message: "Resource created successfully",
        data: resource
      });
    } catch (dbError) {
      await session.abortTransaction();
      throw dbError;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('[CRITICAL ERROR] Resource creation failed:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      type: typeof error
    });

    // Special handling for specific error types
    if (error.name === 'MongoServerError') {
      console.error('[DATABASE ERROR] MongoDB error details:', {
        code: error.code,
        codeName: error.codeName,
        keyPattern: error.keyPattern,
        keyValue: error.keyValue
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        type: error.name,
        stack: error.stack
      } : undefined,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'none'
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




