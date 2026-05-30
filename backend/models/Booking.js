const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: String, 
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return this.startTime < value;
      },
      message: 'End time must be after the start time.'
    }
  }
}, { timestamps: true });

// Indexing for high performance conflict checking
BookingSchema.index({ resourceId: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model('Booking', BookingSchema);