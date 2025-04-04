const ResourceType = require('../models/resourseType');

const createResourceType = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({ success: false, error: 'Name and description is required' });
    }

    if (description.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Description cannot exceed 500 characters'
      });
    }

    const resourceType = await ResourceType.create({
      name,
      description
    });

    res.status(201).json({
      success: true,
      data: resourceType
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Resource type with this name already exists'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

const getResourceTypes = async (req, res) => {
  try {
    const resourceTypes = await ResourceType.find().sort({ name: 1 });
    
    res.json({
      success: true,
      count: resourceTypes.length,
      data: resourceTypes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

const updateResourceType = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const resourceType = await ResourceType.findByIdAndUpdate(
      req.params.id,
      {
        name: name?.trim(),
        description: description?.trim()
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!resourceType) {
      return res.status(404).json({
        success: false,
        error: 'Resource type not found'
      });
    }

    if (description.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Description cannot exceed 500 characters'
      });
    }

    res.json({
      success: true,
      data: resourceType
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Resource type with this name already exists'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

const deleteResourceType = async (req, res) => {
  try {
    const resourceType = await ResourceType.findByIdAndDelete(req.params.id);

    if (!resourceType) {
      return res.status(404).json({
        success: false,
        error: 'Resource type not found'
      });
    }

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

module.exports = {
  createResourceType,
  getResourceTypes,
  updateResourceType,
  deleteResourceType
};