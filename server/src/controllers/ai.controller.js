const DoctorProfile = require('../models/DoctorProfile');
const asyncHandler = require('../utils/asyncHandler');
const { suggest: suggestFromAi } = require('../services/ai.service');


const suggest = asyncHandler(async (req, res) => {
  const specialties = await DoctorProfile.distinct('specialty', { approvalStatus: 'approved' });
  const suggestion = await suggestFromAi({ symptoms: req.body.symptoms, specialties });
  res.json({ suggestion });
});

module.exports = { suggest };