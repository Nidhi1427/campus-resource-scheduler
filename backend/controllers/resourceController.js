const Resource = require('../models/Resource');

// @desc    Get all available campus resources
// @route   GET /api/resources
// @access  Public
const getResources = async (req, res) => {
  try {
    const resources = await Resource.find({});
    res.status(200).json({
      success: true,
      count: resources.length,
      data: resources
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error: Could not fetch resources",
      error: error.message
    });
  }
};

module.exports = {
  getResources
};