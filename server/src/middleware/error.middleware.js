const { nodeEnv } = require('../config/env');

function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}


function errorHandler(err, req, res, next) {
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    const message = field === 'licenseNo' ? 'License number is already registered' : 'Email is already registered';
    return res.status(409).json({ message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body' });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    message: status >= 500 && nodeEnv === 'production' ? 'Internal server error' : err.message,
  });
}

module.exports = { notFound, errorHandler };