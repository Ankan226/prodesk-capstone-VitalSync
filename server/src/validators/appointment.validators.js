const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')
  .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), 'Invalid date');
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use the format HH:mm');
const reason = z.string().trim().min(3, 'Please describe the reason for your visit').max(300);

const createAppointmentSchema = z.strictObject({ doctorId: objectId, date, slotStart: time, reason });

const updateAppointmentSchema = z.strictObject({ date, slotStart: time, reason });

const availabilitySchema = z.strictObject({
  days: z
    .array(
      z
        .strictObject({
          dayOfWeek: z.number().int().min(0).max(6),
          startTime: time,
          endTime: time,
          slotMinutes: z.union([z.literal(15), z.literal(30), z.literal(45)]),
          isActive: z.boolean(),
        })
        .refine((d) => !d.isActive || d.endTime > d.startTime, {
          message: 'End time must be after start time',
          path: ['endTime'],
        })
    )
    .min(1)
    .max(7),
});

const checkoutSchema = z.strictObject({ appointmentId: objectId });

module.exports = { createAppointmentSchema, updateAppointmentSchema, availabilitySchema, checkoutSchema };