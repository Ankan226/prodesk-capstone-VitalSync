const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const logger = require('../utils/logger');


(async () => {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || 'admin@vitalsync.test').toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    logger.error('Set ADMIN_PASSWORD (at least 8 characters) in server/.env first.');
    process.exit(1);
  }

  if (await User.findOne({ email })) {
    logger.info(`Admin already exists: ${email}`);
  } else {
    await User.create({
      name: 'VitalSync Admin',
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'admin',
      termsAcceptedAt: new Date(),
    });
    logger.info(`Admin created: ${email}`);
  }

  await mongoose.disconnect();
})();