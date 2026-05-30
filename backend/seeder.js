const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Resource = require('./models/Resource');

// Load env variables
dotenv.config();

const sampleResources = [
  {
    name: "Advanced AI & Robotics Lab",
    type: "Lab",
    capacity: 25,
    location: "Block 3, 4th Floor"
  },
  {
    name: "IoT Innovation Center",
    type: "Lab",
    capacity: 15,
    location: "Block 3, 2nd Floor"
  },
  {
    name: "Main Seminar Hall",
    type: "Conference Room",
    capacity: 120,
    location: "Admin Block, Ground Floor"
  },
  {
    name: "Quantum Computing Pod",
    type: "Study Pod",
    capacity: 4,
    location: "Library, Left Wing"
  }
];

const seedDatabase = async () => {
  try {
    // Connect to the DB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔌 Connected to DB for seeding...");

    // Clear out anything existing so we don't duplicate data
    await Resource.deleteMany();
    console.log("🧹 Cleared old resources...");

    // Insert the new sample resources
    await Resource.insertMany(sampleResources);
    console.log("🌱 Database successfully seeded with Campus Resources!");

    // Exit the script process cleanly
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();