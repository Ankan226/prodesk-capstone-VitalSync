const User = require('../models/User');

const mirrorDoctorStatus = (userId, status) => User.updateOne({ _id: userId }, { doctorStatus: status });

module.exports = { mirrorDoctorStatus };