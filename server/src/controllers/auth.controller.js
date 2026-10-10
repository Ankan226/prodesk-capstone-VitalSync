const bcrypt = require('bcryptjs');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const asyncHandler = require('../utils/asyncHandler');
const { buildSession, getDoctorProfile } = require('../utils/session');

const SALT_ROUNDS = 10; 
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', SALT_ROUNDS);

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, specialty, licenseNo, yearsOfExperience, consultationFee, bio } = req.body;

  if (await User.findOne({ email })) {
    return res.status(409).json({ message: 'Email is already registered' });
  }
  if (role === 'doctor' && (await DoctorProfile.findOne({ licenseNo: licenseNo.toUpperCase() }))) {
    return res.status(409).json({ message: 'License number is already registered' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    doctorStatus: role === 'doctor' ? 'pending' : undefined,
    termsAcceptedAt: new Date(),
  });

  if (role === 'doctor') {
    try {
      await DoctorProfile.create({
        userId: user._id,
        specialty,
        licenseNo,
        yearsOfExperience,
        consultationFee,
        bio,
        statusHistory: [{ status: 'pending', note: 'Application submitted', at: new Date() }],
      });
    } catch (err) {
      await User.deleteOne({ _id: user._id });
      throw err;
    }
  }

  res.status(201).json(await buildSession(user));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  const passwordOk = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

  if (!user || !passwordOk) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  if (!user.isActive) {
    return res.status(403).json({ message: 'This account has been deactivated' });
  }

  await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });
  res.json(await buildSession(user));
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user, doctorProfile: await getDoctorProfile(req.user) });
});

module.exports = { register, login, me };