const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  resourceType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResourceType',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  images: [{
    url: String,
    public_id: String
  }],
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['available', 'allocated', 'maintenance'],
    default: 'available'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

// Virtual property to easily access the type name
ResourceSchema.virtual('typeName', {
  ref: 'ResourceType',
  localField: 'resourceType',
  foreignField: '_id',
  justOne: true,
  options: { select: 'name' }
});

const Resource = mongoose.models.Resource || mongoose.model('Resource', ResourceSchema);

module.exports = Resource;