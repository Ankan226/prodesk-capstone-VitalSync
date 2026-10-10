const mongoose = require('mongoose');
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'doctor', 'patient'], default: 'patient', required: true },
    isActive: { type: Boolean, default: true },
    doctorStatus: { type: String, enum: ['pending', 'approved', 'rejected'] },
    termsAcceptedAt: { type: Date },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);


userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);