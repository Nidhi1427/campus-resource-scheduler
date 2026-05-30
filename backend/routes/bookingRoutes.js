const express = require('express');
const router = express.Router();
const { createBooking, getBookingsByResource } = require('../controllers/bookingController');

// POST /api/bookings - Create a booking
router.post('/', createBooking);

// GET /api/bookings/:resourceId?date=YYYY-MM-DD - Get day's bookings for a resource
router.get('/:resourceId', getBookingsByResource);

module.exports = router;