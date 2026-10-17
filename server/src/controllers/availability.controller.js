const Availability = require('../models/Availability');
const asyncHandler = require('../utils/asyncHandler');

const defaultDay = (dayOfWeek) => ({ dayOfWeek, startTime: '09:00', endTime: '13:00', slotMinutes: 30, isActive: false });


async function loadDays(doctorId) {
  const rules = await Availability.find({ doctorId });
  const byDay = new Map(rules.map((r) => [r.dayOfWeek, r]));
  return Array.from({ length: 7 }, (_, i) => {
    const r = byDay.get(i);
    return r
      ? { dayOfWeek: r.dayOfWeek, startTime: r.startTime, endTime: r.endTime, slotMinutes: r.slotMinutes, isActive: r.isActive }
      : defaultDay(i);
  });
}

const getMine = asyncHandler(async (req, res) => {
  res.json({ days: await loadDays(req.doctorProfile._id) });
});

const saveMine = asyncHandler(async (req, res) => {
  const doctorId = req.doctorProfile._id;
  await Availability.bulkWrite(
    req.body.days.map((d) => ({
      updateOne: {
        filter: { doctorId, dayOfWeek: d.dayOfWeek },
        update: { $set: { startTime: d.startTime, endTime: d.endTime, slotMinutes: d.slotMinutes, isActive: d.isActive } },
        upsert: true,
      },
    }))
  );
  res.json({ days: await loadDays(doctorId) });
});

module.exports = { getMine, saveMine };