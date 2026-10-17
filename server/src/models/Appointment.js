const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'DoctorProfile', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    slotStart: { type: String, required: true }, 
    slotEnd: { type: String, required: true },
    status: { type: String, enum: ['booked', 'completed', 'cancelled', 'no_show'], default: 'booked' },
    reason: { type: String, trim: true, maxlength: 300 },
    paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
    paidAt: { type: Date },
    stripeSessionId: { type: String },
  },
  { timestamps: true }
);


appointmentSchema.index(
  { doctorId: 1, date: 1, slotStart: 1 },
  { unique: true, partialFilterExpression: { status: 'booked' } }
);
appointmentSchema.index({ patientId: 1, date: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);