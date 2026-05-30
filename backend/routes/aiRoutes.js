const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Optimization engine query path
router.post('/optimize', aiController.getOptimizationSuggestions);

module.exports = router;