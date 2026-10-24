const { nodeEnv } = require('../config/env');
const logger = require('../utils/logger');

function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}


function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    const message =
      field === 'licenseNo' ? 'License number is already registered'
      : field === 'email' ? 'Email is already registered'
      : 'That record already exists';
    return res.status(409).json({ message });
  }
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body' });
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Request body is too large' });
  if (err.name === 'ValidationError' && err.errors) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
    });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: `Invalid value for ${err.path}` });

  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
  if (status >= 500) logger.error(err);

  const visible = status < 500 || err.expose === true || nodeEnv !== 'production';
  res.status(status).json({ message: visible ? err.message : 'Internal server error' });
}

module.exports = { notFound, errorHandler };