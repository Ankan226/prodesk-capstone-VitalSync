const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const Availability = require('../models/Availability');
const asyncHandler = require('../utils/asyncHandler');
const { generateSlots, dayOfWeek, todayUTC } = require('../utils/slots');

const populateAll = (query) =>
  query
    .populate({ path: 'doctorId', select: 'specialty consultationFee userId', populate: { path: 'userId', select: 'name' } })
    .populate('patientId', 'name email');

const present = (a) => ({
  id: a._id.toString(),
  date: a.date,
  slotStart: a.slotStart,
  slotEnd: a.slotEnd,
  status: a.status,
  reason: a.reason,
  paymentStatus: a.paymentStatus,
  doctor: a.doctorId && {
    id: a.doctorId._id.toString(),
    name: a.doctorId.userId && a.doctorId.userId.name,
    specialty: a.doctorId.specialty,
    consultationFee: a.doctorId.consultationFee,
  },
  patient: a.patientId && { id: a.patientId._id.toString(), name: a.patientId.name, email: a.patientId.email },
});


async function resolveSlot(doctorId, date, slotStart) {
  const rule = await Availability.findOne({ doctorId, dayOfWeek: dayOfWeek(date), isActive: true });
  if (!rule) return null;
  return generateSlots(rule).find((s) => s.start === slotStart) || null;
}


async function loadOwnedByPatient(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: 'Invalid appointment id' });
    return null;
  }
  const appt = await Appointment.findById(id);
  if (!appt) {
    res.status(404).json({ message: 'Appointment not found' });
    return null;
  }
  if (appt.patientId.toString() !== req.user._id.toString()) {
    res.status(403).json({ message: 'You can only access your own appointments' });
    return null;
  }
  return appt;
}

const create = asyncHandler(async (req, res) => {
  const { doctorId, date, slotStart, reason } = req.body;

  if (date < todayUTC()) return res.status(400).json({ message: 'Choose today or a future date' });

  const doctor = await DoctorProfile.findOne({ _id: doctorId, approvalStatus: 'approved' });
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

  const slot = await resolveSlot(doctor._id, date, slotStart);
  if (!slot) return res.status(400).json({ message: 'That time is not available for this doctor' });

  try {
    const appt = await Appointment.create({
      doctorId: doctor._id,
      patientId: req.user._id,
      date,
      slotStart: slot.start,
      slotEnd: slot.end,
      reason,
    });
    const full = await populateAll(Appointment.findById(appt._id));
    res.status(201).json({ appointment: present(full) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'That slot was just booked. Please pick another time.' });
    throw err;
  }
});


const list = asyncHandler(async (req, res) => {
  let filter;
  if (req.user.role === 'patient') {
    filter = { patientId: req.user._id };
  } else if (req.user.role === 'doctor') {
    const profile = await DoctorProfile.findOne({ userId: req.user._id, approvalStatus: 'approved' });
    if (!profile) return res.status(403).json({ message: 'Your doctor account is not approved yet' });
    filter = { doctorId: profile._id };
  } else {
    return res.status(403).json({ message: 'Not available for this role' });
  }
  const items = await populateAll(Appointment.find(filter).sort({ date: 1, slotStart: 1 }));
  res.json({ appointments: items.map(present) });
});

const getOne = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid appointment id' });

  const appt = await populateAll(Appointment.findById(id));
  if (!appt) return res.status(404).json({ message: 'Appointment not found' });

  let allowed = false;
  if (req.user.role === 'patient') allowed = appt.patientId._id.toString() === req.user._id.toString();
  if (req.user.role === 'doctor') allowed = appt.doctorId.userId._id.toString() === req.user._id.toString();
  if (!allowed) return res.status(403).json({ message: 'You can only access your own appointments' });

  res.json({ appointment: present(appt) });
});


const update = asyncHandler(async (req, res) => {
  const appt = await loadOwnedByPatient(req, res);
  if (!appt) return;

  if (appt.status !== 'booked') return res.status(409).json({ message: 'Only booked appointments can be changed' });

  const { date, slotStart, reason } = req.body;
  if (date < todayUTC()) return res.status(400).json({ message: 'Choose today or a future date' });

  const slot = await resolveSlot(appt.doctorId, date, slotStart);
  if (!slot) return res.status(400).json({ message: 'That time is not available for this doctor' });

  appt.date = date;
  appt.slotStart = slot.start;
  appt.slotEnd = slot.end;
  if (reason !== undefined) appt.reason = reason;

  try {
    await appt.save();
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'That slot was just booked. Please pick another time.' });
    throw err;
  }
  res.json({ appointment: present(await populateAll(Appointment.findById(appt._id))) });
});


const remove = asyncHandler(async (req, res) => {
  const appt = await loadOwnedByPatient(req, res);
  if (!appt) return;

  if (appt.status === 'completed') {
    return res.status(409).json({ message: 'Completed visits are part of your medical history and cannot be deleted' });
  }
  if (appt.paymentStatus === 'paid') {
    return res.status(409).json({ message: 'Paid appointments cannot be deleted yet. Please contact support for a refund.' });
  }

  await appt.deleteOne();
  res.json({ id: appt._id.toString(), message: 'Appointment deleted' });
});

module.exports = { create, list, getOne, update, remove };