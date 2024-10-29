// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;

// Use environment variable for MongoDB connection URL
const mongoDb_connect_url = process.env.MONGODB_URI || "mongodb+srv://Admin-seiha:Seiha123@cluster0.8fulo.mongodb.net/todolistD"; // Default for local testing

// Connect to MongoDB
mongoose.connect(mongoDb_connect_url)
  .then(() => {
    console.log("Successfully connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// Define a simple route
app.get('/', (req, res) => {
  res.send('Hello, Vercel with MongoDB!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
