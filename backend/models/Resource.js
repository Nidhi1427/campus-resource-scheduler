const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String, 
    required: true,
    enum: ['Lab', 'Conference Room', 'Equipment', 'Study Pod'] // Restricts input values
  },
  capacity: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Resource', ResourceSchema);