const logger = require('../utils/logger');


module.exports = (req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const path = req.originalUrl.split('?')[0];
    if (path === '/health') return;
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    logger.always(`${new Date().toISOString()} ${req.method} ${path} ${res.statusCode} ${ms.toFixed(0)}ms`);
  });
  next();
};