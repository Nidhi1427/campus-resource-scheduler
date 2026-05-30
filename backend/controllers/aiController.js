const Resource = require('../models/Resource');
const Booking = require('../models/Booking');

exports.getOptimizationSuggestions = async (req, res) => {
  try {
    const { resourceId, startTime, endTime, capacityRequired } = req.body;

    if (!resourceId || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: "Missing tracking parameters." });
    }

    const reqStart = new Date(startTime);
    const reqEnd = new Date(endTime);
    const requestedDuration = reqEnd - reqStart;

    // 1. Fetch all other alternative spaces that fit the capacity criteria
    const capacityQuery = capacityRequired ? { capacity: { $gte: Number(capacityRequired) } } : {};
    const alternateResources = await Resource.find({ 
      _id: { $ne: resourceId },
      ...capacityQuery
    });

    const suggestions = [];

    // 2. Scan each alternative room's schedule for today
    for (const resource of alternateResources) {
      const todayStart = new Date(reqStart);
      todayStart.setHours(9, 0, 0, 0);
      const todayEnd = new Date(reqStart);
      todayEnd.setHours(17, 0, 0, 0);

      // Get all bookings for this alternate room today
      const resourceBookings = await Booking.find({
        resourceId: resource._id,
        startTime: { $gte: todayStart },
        endTime: { $lte: todayEnd }
      }).sort({ startTime: 1 });

      // Check if the exact requested time slot is completely free in this room
      const hasConflict = resourceBookings.some(b => {
        return (reqStart < b.endTime && reqEnd > b.startTime);
      });

      if (!hasConflict) {
        suggestions.push({
          type: 'ROOM_ALT',
          resource,
          suggestedStart: reqStart.toISOString(),
          suggestedEnd: reqEnd.toISOString(),
          reason: ` space "${resource.name}" is completely vacant during your requested time window.`
        });
        continue;
      }

      // 3. Time-Shift Optimization: Find the next available opening in the current room
      // Look for openings between existing bookings from 9 AM to 5 PM
      let checkTime = new Date(todayStart);
      
      while (checkTime < todayEnd) {
        let potentialEnd = new Date(checkTime.getTime() + requestedDuration);
        if (potentialEnd > todayEnd) break;

        // Verify if this window hits any bookings
        const slotConflict = resourceBookings.some(b => {
          return (checkTime < b.endTime && potentialEnd > b.startTime);
        });

        if (!slotConflict) {
          // Found a valid alternative time window!
          suggestions.push({
            type: 'TIME_SHIFT',
            resource: await Resource.findById(resourceId),
            suggestedStart: checkTime.toISOString(),
            suggestedEnd: potentialEnd.toISOString(),
            reason: `Shift schedule slightly to fill an empty operational track.`
          });
          break; // Grab the first closest time-shift match
        }

        // Step forward by 30-minute intervals to check the next window
        checkTime.setMinutes(checkTime.getMinutes() + 30);
      }
    }

    return res.status(200).json({
      success: true,
      suggestions: suggestions.slice(0, 3) // Limit to top 3 smart recs
    });

  } catch (error) {
    console.error("❌ AI Optimizer Engine failure:", error);
    return res.status(500).json({ success: false, message: "Internal optimization loop exception." });
  }
};