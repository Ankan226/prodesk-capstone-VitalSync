const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const logger = require('../utils/logger');

(async () => {
  await connectDB();

  const profiles = await DoctorProfile.find();
  for (const p of profiles) {
    if (p.statusHistory.length === 0) {
      p.statusHistory.push({
        status: p.approvalStatus,
        note: p.rejectionReason || 'Added from earlier data',
        by: p.reviewedBy,
        at: p.reviewedAt || p.submittedAt || new Date(),
      });
      await p.save();
    }
    await User.updateOne({ _id: p.userId }, { doctorStatus: p.approvalStatus });
  }

  logger.info(`Updated ${profiles.length} doctor profile(s)`);
  await mongoose.disconnect();
})();