const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const bookingRoutes = require('./routes/bookingRoutes');
const resourceRoutes = require('./routes/resourceRoutes'); // 1. Import resource routes

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Parent Routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/resources', resourceRoutes); // 2. Mount resource routes

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`⚡ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});