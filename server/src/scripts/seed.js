const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

// Creates the admin account (admins can never self-register). Safe to run more than once.
(async () => {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || 'admin@vitalsync.test').toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    console.error('Set ADMIN_PASSWORD (at least 8 characters) in server/.env first.');
    process.exit(1);
  }

  if (await User.findOne({ email })) {
    console.log(`Admin already exists: ${email}`);
  } else {
    await User.create({
      name: 'VitalSync Admin',
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'admin',
      termsAcceptedAt: new Date(),
    });
    console.log(`Admin created: ${email}`);
  }

  await mongoose.disconnect();
})();