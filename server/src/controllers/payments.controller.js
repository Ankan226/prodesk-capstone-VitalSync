const Stripe = require('stripe');
const Appointment = require('../models/Appointment');
const asyncHandler = require('../utils/asyncHandler');
const { stripeSecretKey, clientUrls } = require('../config/env');

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
const notConfigured = (res) => res.status(503).json({ message: 'Payments are not configured on this server' });
const MIN_PAYMENT_INR = 50;
const originFor = (req) => (clientUrls.includes(req.headers.origin) ? req.headers.origin : clientUrls[0]);


const checkout = asyncHandler(async (req, res) => {
  if (!stripe) return notConfigured(res);

  const appt = await Appointment.findById(req.body.appointmentId).populate({
    path: 'doctorId',
    select: 'specialty consultationFee userId',
    populate: { path: 'userId', select: 'name' },
  });
  if (!appt) return res.status(404).json({ message: 'Appointment not found' });
  if (appt.patientId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only pay for your own appointments' });
  }
  if (appt.status !== 'booked') return res.status(409).json({ message: 'Only booked appointments can be paid' });
  if (appt.paymentStatus === 'paid') return res.status(409).json({ message: 'This appointment is already paid' });

  const fee = Math.max(Number(appt.doctorId.consultationFee) || 0, MIN_PAYMENT_INR);
  const doctorName = (appt.doctorId.userId && appt.doctorId.userId.name) || 'your doctor';
  const origin = originFor(req);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'inr',
          unit_amount: Math.round(fee * 100), 
          product_data: {
            name: `Consultation with ${doctorName}`,
            description: `${appt.doctorId.specialty}, ${appt.date} at ${appt.slotStart}`,
          },
        },
      },
    ],
    metadata: { appointmentId: appt._id.toString(), userId: req.user._id.toString() },
    client_reference_id: appt._id.toString(),
    customer_email: req.user.email,
    success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/payment/cancel`,
  });

  res.json({ url: session.url });
});


const verify = asyncHandler(async (req, res) => {
  if (!stripe) return notConfigured(res);

  const sessionId = String(req.query.session_id || '');
  if (!sessionId.startsWith('cs_')) return res.status(400).json({ message: 'Invalid payment session' });

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return res.status(404).json({ message: 'Payment session not found' });
  }

  const appt = await Appointment.findById(session.metadata && session.metadata.appointmentId);
  if (!appt) return res.status(404).json({ message: 'Appointment not found' });
  if (appt.patientId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'This payment belongs to another account' });
  }

  if (session.payment_status !== 'paid') return res.json({ status: session.payment_status });

  if (appt.paymentStatus !== 'paid') {
    appt.paymentStatus = 'paid';
    appt.paidAt = new Date();
    appt.stripeSessionId = session.id;
    await appt.save();
  }
  res.json({ status: 'paid', appointmentId: appt._id.toString() });
});

module.exports = { checkout, verify };