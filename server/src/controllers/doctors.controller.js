const mongoose = require('mongoose');
const DoctorProfile = require('../models/DoctorProfile');
const Availability = require('../models/Availability');
const Appointment = require('../models/Appointment');
const asyncHandler = require('../utils/asyncHandler');
const { generateSlots, dayOfWeek, isValidDate, todayUTC, upcomingDates, findNextAvailable } = require('../utils/slots');

const LOOKAHEAD_DAYS = 30;


const listDoctors = asyncHandler(async (req, res) => {
  const profiles = await DoctorProfile.find({ approvalStatus: 'approved' })
    .populate('userId', 'name')
    .sort({ specialty: 1 });

  const ids = profiles.map((p) => p._id);
  const dates = upcomingDates(todayUTC(), LOOKAHEAD_DAYS);

  const [rules, booked] = await Promise.all([
    Availability.find({ doctorId: { $in: ids }, isActive: true }),
    Appointment.find({
      doctorId: { $in: ids },
      status: 'booked',
      date: { $gte: dates[0], $lte: dates[dates.length - 1] },
    }).select('doctorId date slotStart'),
  ]);

  const rulesByDoctor = new Map(); 
  for (const r of rules) {
    const key = r.doctorId.toString();
    if (!rulesByDoctor.has(key)) rulesByDoctor.set(key, new Map());
    rulesByDoctor.get(key).set(r.dayOfWeek, r);
  }

  const takenByDay = new Map(); 
  for (const a of booked) {
    const key = `${a.doctorId}|${a.date}`;
    if (!takenByDay.has(key)) takenByDay.set(key, new Set());
    takenByDay.get(key).add(a.slotStart);
  }
  const noneTaken = new Set();

  res.json({
    doctors: profiles.map((p) => {
      const id = p._id.toString();
      const byDay = rulesByDoctor.get(id) || new Map();
      return {
        id,
        name: p.userId && p.userId.name,
        specialty: p.specialty,
        consultationFee: p.consultationFee,
        yearsOfExperience: p.yearsOfExperience,
        bio: p.bio,
        workingDays: [...byDay.keys()].sort((a, b) => a - b),
        nextAvailable: findNextAvailable(
          dates,
          (d) => byDay.get(dayOfWeek(d)),
          (d) => takenByDay.get(`${id}|${d}`) || noneTaken
        ),
      };
    }),
  });
});


const getSlots = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date, exclude } = req.query;

  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid doctor id' });
  if (!isValidDate(date)) return res.status(400).json({ message: 'date must be in the format YYYY-MM-DD' });

  const doctor = await DoctorProfile.findOne({ _id: id, approvalStatus: 'approved' });
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

  const rule = await Availability.findOne({ doctorId: doctor._id, dayOfWeek: dayOfWeek(date), isActive: true });
  if (!rule) return res.json({ date, slots: [] });

  const filter = { doctorId: doctor._id, date, status: 'booked' };

  if (exclude && mongoose.isValidObjectId(exclude)) filter._id = { $ne: exclude };
  const taken = new Set((await Appointment.find(filter).select('slotStart')).map((a) => a.slotStart));

  res.json({ date, slots: generateSlots(rule).map((s) => ({ ...s, available: !taken.has(s.start) })) });
});

module.exports = { listDoctors, getSlots };