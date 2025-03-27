const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['laptop', 'mouse', 'keyboard', 'monitor', 'phone', 'other'],
    default: 'other'
  },
  customType: {
    type: String,
    required: function() {
      return this.type === 'other';
    },
    maxlength: 50
  },
  description: {
    type: String,
    default: null,
  },
  images: [{
    url: {
      type: String,
    },
    public_id: {
      type: String,
    }
  }],
  serialNumber: {
    type: String,
    unique: true
  },
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
  timestamps: true
});

const Resource = mongoose.models.Resource || mongoose.model('Resource', ResourceSchema);

module.exports = Resource;