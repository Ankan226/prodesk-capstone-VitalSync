const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'DoctorProfile', required: true },
  dayOfWeek: { type: Number, min: 0, max: 6, required: true }, // 0 = Sunday
  startTime: { type: String, required: true }, // HH:mm
  endTime: { type: String, required: true },
  slotMinutes: { type: Number, default: 30, validate: { validator: (v) => [15, 30, 45].includes(v) } },
  isActive: { type: Boolean, default: true },
});

availabilitySchema.index({ doctorId: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model('Availability', availabilitySchema);