const mongoose = require('mongoose');

const AllocationSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true
  },
  AllocatedDate: {
    type: Date,
    default: Date.now
  },
  returnDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Active', 'Returned'],
    default: 'Active'
  }
}, {
  timestamps: true
});

const Allocation = mongoose.models.Allocation || mongoose.model('Allocation', AllocationSchema);

module.exports = Allocation;