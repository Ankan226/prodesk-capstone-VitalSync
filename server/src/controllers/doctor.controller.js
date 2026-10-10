const DoctorProfile = require('../models/DoctorProfile');
const asyncHandler = require('../utils/asyncHandler');
const { mirrorDoctorStatus } = require('../utils/doctorStatus');

const reapply = asyncHandler(async (req, res) => {
  const { specialty, licenseNo, yearsOfExperience, consultationFee, bio } = req.body;
  const max = DoctorProfile.MAX_REAPPLY;
  const now = new Date();

  const set = {
    specialty,
    licenseNo: licenseNo.toUpperCase(),
    approvalStatus: 'pending',
    submittedAt: now,
  };
  if (yearsOfExperience !== undefined) set.yearsOfExperience = yearsOfExperience;
  if (consultationFee !== undefined) set.consultationFee = consultationFee;
  if (bio !== undefined) set.bio = bio;

  const updated = await DoctorProfile.findOneAndUpdate(
    { userId: req.user._id, approvalStatus: 'rejected', reapplyCount: { $not: { $gte: max } } },
    {
      $set: set,
      $unset: { rejectionReason: '', reviewedBy: '', reviewedAt: '' }, 
      $inc: { reapplyCount: 1 },
      $push: { statusHistory: { status: 'pending', note: 'Reapplied', at: now } },
    },
    { new: true, runValidators: true }
  );

  if (!updated) {
    const profile = await DoctorProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ message: 'No application found for this account' });
    if (profile.approvalStatus !== 'rejected') {
      return res.status(409).json({ message: 'Only rejected applications can be resubmitted' });
    }
    return res.status(403).json({ message: `You have used all ${max} reapplications. Please contact support.` });
  }

  await mirrorDoctorStatus(req.user._id, 'pending');
  res.json({ doctorProfile: updated });
});

module.exports = { reapply };