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
    maxlength: 30
  },
  description: {
    type: String,
    default: null,
  }
}, {
  timestamps: true
});

const Resource = mongoose.models.Resource || mongoose.model('Resource', ResourceSchema);

module.exports = Resource;