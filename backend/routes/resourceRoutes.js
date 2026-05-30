const express = require('express');
const router = express.Router();
const { getResources } = require('../controllers/resourceController');

// Define the root route for resources
router.get('/', getResources);

module.exports = router;