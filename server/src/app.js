const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const { clientUrls } = require('./config/env');
const standardizeErrors = require('./middleware/standardize.middleware');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiters');
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const doctorRoutes = require('./routes/doctor.routes');
const adminRoutes = require('./routes/admin.routes');
const doctorsRoutes = require('./routes/doctors.routes');
const appointmentsRoutes = require('./routes/appointments.routes');
const availabilityRoutes = require('./routes/availability.routes');
const paymentsRoutes = require('./routes/payments.routes');
const aiRoutes = require('./routes/ai.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.set('trust proxy', 1);
app.use(standardizeErrors);
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || clientUrls.includes(origin)) return cb(null, true);
      const err = new Error('Not allowed by CORS');
      err.status = 403;
      cb(err);
    },
  })
);
app.use(express.json({ limit: '10kb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/ai', aiRoutes); 

app.use(notFound);
app.use(errorHandler);

module.exports = app;