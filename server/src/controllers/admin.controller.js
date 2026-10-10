const mongoose = require('mongoose');
const DoctorProfile = require('../models/DoctorProfile');
const asyncHandler = require('../utils/asyncHandler');
const { mirrorDoctorStatus } = require('../utils/doctorStatus');

const present = (p) => ({
  id: p._id.toString(),
  name: p.userId && p.userId.name,
  email: p.userId && p.userId.email,
  specialty: p.specialty,
  licenseNo: p.licenseNo,
  yearsOfExperience: p.yearsOfExperience,
  consultationFee: p.consultationFee,
  approvalStatus: p.approvalStatus,
  rejectionReason: p.rejectionReason,
  reapplyCount: p.reapplyCount,
  submittedAt: p.submittedAt,
  reviewedAt: p.reviewedAt,
});

const listDoctors = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = ['pending', 'approved', 'rejected'].includes(status) ? { approvalStatus: status } : {};
  const profiles = await DoctorProfile.find(filter).populate('userId', 'name email').sort({ submittedAt: -1 });
  res.json({ doctors: profiles.map(present) });
});

async function review(req, res, status, reason) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid doctor id' });
  }
  const profile = await DoctorProfile.findById(id).populate('userId', 'name email');
  if (!profile) {
    return res.status(404).json({ message: 'Doctor application not found' });
  }
  if (profile.approvalStatus !== 'pending') {
    return res.status(409).json({ message: `This application was already reviewed (${profile.approvalStatus})` });
  }

  const now = new Date();
  profile.approvalStatus = status;
  profile.rejectionReason = status === 'rejected' ? reason : undefined;
  profile.reviewedBy = req.user._id;
  profile.reviewedAt = now;
  profile.statusHistory.push({
    status,
    note: status === 'rejected' ? reason : 'Approved',
    by: req.user._id,
    at: now,
  });
  await profile.save();
  await mirrorDoctorStatus(profile.userId._id, status); 

  res.json({ doctor: present(profile) });
}

const approveDoctor = asyncHandler((req, res) => review(req, res, 'approved'));
const rejectDoctor = asyncHandler((req, res) => review(req, res, 'rejected', req.body.reason));

module.exports = { listDoctors, approveDoctor, rejectDoctor };