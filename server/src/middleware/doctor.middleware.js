const DoctorProfile = require('../models/DoctorProfile');
const asyncHandler = require('../utils/asyncHandler');


const requireApprovedDoctor = asyncHandler(async (req, res, next) => {
  const profile = await DoctorProfile.findOne({ userId: req.user._id });
  if (!profile || profile.approvalStatus !== 'approved') {
    return res.status(403).json({
      message: 'Your doctor account is not approved yet',
      approvalStatus: profile ? profile.approvalStatus : 'none',
    });
  }
  req.doctorProfile = profile;
  next();
});

module.exports = { requireApprovedDoctor };