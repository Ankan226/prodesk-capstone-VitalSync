const DoctorProfile = require('../models/DoctorProfile');
const { signToken } = require('./token');

async function getDoctorProfile(user) {
  return user.role === 'doctor' ? DoctorProfile.findOne({ userId: user._id }) : null;
}

async function buildSession(user) {
  return { token: signToken(user), user, doctorProfile: await getDoctorProfile(user) };
}

module.exports = { getDoctorProfile, buildSession };