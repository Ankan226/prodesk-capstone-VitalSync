const mongoose = require('mongoose');
const { mongoUri } = require('./env');
const logger = require('../utils/logger');

async function connectDB() {
  try {
    await mongoose.connect(mongoUri);
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;