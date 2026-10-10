const mongoose = require('mongoose');

const MAX_REAPPLY = 3;

const statusEntrySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['pending', 'approved', 'rejected'], required: true },
    note: { type: String, trim: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);


const doctorProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specialty: { type: String, required: true, trim: true },
  licenseNo: { type: String, required: true, unique: true, trim: true, uppercase: true },
  yearsOfExperience: { type: Number, min: 0, max: 70 },
  consultationFee: { type: Number, min: 0 },
  bio: { type: String, trim: true, maxlength: 500 },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String, trim: true },
  reapplyCount: { type: Number, default: 0, min: 0 },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  statusHistory: { type: [statusEntrySchema], default: [] },
});

doctorProfileSchema.statics.MAX_REAPPLY = MAX_REAPPLY;

doctorProfileSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.reapplyLimit = MAX_REAPPLY; 
    delete ret._id;
    delete ret.__v;
    delete ret.statusHistory; 
    return ret;
  },
});

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);