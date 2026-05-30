const Booking = require('../models/Booking');

// @desc    Create a new resource booking (with conflict check)
// @route   POST /api/bookings
// @access  Public (You can add auth middleware later)
const createBooking = async (req, res) => {
  try {
    const { resourceId, title, user, startTime, endTime } = req.body;

    const newStart = new Date(startTime);
    const newEnd = new Date(endTime);

    // 1. Validation: End time MUST be after start time
    if (newStart >= newEnd) {
      return res.status(400).json({
        success: false,
        message: "Invalid Time Frame: End time must be strictly after the start time."
      });
    }

    // 2. The Conflict Check Algorithm
    // Checks if an existing booking overlaps with our requested window
    const overlappingBooking = await Booking.findOne({
      resourceId: resourceId,
      $and: [
        { startTime: { $lt: newEnd } }, // Existing start is before our requested end
        { endTime: { $gt: newStart } }  // Existing end is after our requested start
      ]
    });

    if (overlappingBooking) {
      return res.status(400).json({
        success: false,
        message: `Conflict detected! This slot overlaps with an existing booking: '${overlappingBooking.title}' from ${overlappingBooking.startTime.toLocaleTimeString()} to ${overlappingBooking.endTime.toLocaleTimeString()}.`
      });
    }

    // 3. Save the booking if the coast is clear
    const booking = await Booking.create({
      resourceId,
      title,
      user,
      startTime: newStart,
      endTime: newEnd
    });

    res.status(201).json({
      success: true,
      data: booking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error: Could not process booking.",
      error: error.message
    });
  }
};

// @desc    Get all bookings for a specific resource on a specific date
// @route   GET /api/bookings/:resourceId
// @access  Public
const getBookingsByResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { date } = req.query; // Expecting string format YYYY-MM-DD from frontend

    if (!date) {
      return res.status(400).json({ success: false, message: "Please provide a date query parameter (YYYY-MM-DD)." });
    }

    // Define boundaries for the entire requested day (00:00:00.000 to 23:59:59.999)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Find bookings for this resource that fall within this specific day
    const bookings = await Booking.find({
      resourceId,
      startTime: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ startTime: 1 }); // Sort chronologically

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error: Could not fetch bookings.",
      error: error.message
    });
  }
};

module.exports = {
  createBooking,
  getBookingsByResource
};