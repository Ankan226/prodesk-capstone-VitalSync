const { z } = require('zod');

const email = z.string().trim().toLowerCase().email('Enter a valid email address');

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
    email,
    // bcrypt only uses the first 72 bytes, so cap the length.
    password: z.string().min(8, 'Password must be at least 8 characters').max(72),
    role: z.enum(['patient', 'doctor']).default('patient'),
    termsAccepted: z.boolean().refine((v) => v === true, 'You must accept the terms'),
    specialty: z.string().trim().min(2).max(80).optional(),
    licenseNo: z.string().trim().min(4, 'License number is too short').max(40).optional(),
    yearsOfExperience: z.number().int().min(0).max(70).optional(),
    consultationFee: z.number().min(0).max(100000).optional(),
    bio: z.string().trim().max(500).optional(),
  })
  .refine((d) => d.role !== 'doctor' || !!d.specialty, {
    message: 'Specialty is required for doctors',
    path: ['specialty'],
  })
  .refine((d) => d.role !== 'doctor' || !!d.licenseNo, {
    message: 'License number is required for doctors',
    path: ['licenseNo'],
  });

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(72),
});

const rejectSchema = z.object({
  reason: z.string().trim().min(5, 'Give a reason (at least 5 characters)').max(300),
});

const reapplySchema = z.object({
  specialty: z.string().trim().min(2).max(80),
  licenseNo: z.string().trim().min(4, 'License number is too short').max(40),
  yearsOfExperience: z.number().int().min(0).max(70).optional(),
  consultationFee: z.number().min(0).max(100000).optional(),
  bio: z.string().trim().max(500).optional(),
});

module.exports = { registerSchema, loginSchema, rejectSchema, reapplySchema };