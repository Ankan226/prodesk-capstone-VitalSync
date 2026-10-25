const rateLimit = require('express-rate-limit');

const tooMany = (message) => (req, res) => res.status(429).json({ message });
const base = { standardHeaders: 'draft-7', legacyHeaders: false };


const apiLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 300,
  handler: tooMany('Too many requests. Please slow down.'),
});


const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 60,
  handler: tooMany('Too many attempts. Please try again later.'),
});


const loginLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  handler: tooMany('Too many failed login attempts. Try again in 15 minutes.'),
});


const perUser = (req) => req.user._id.toString();
const aiBurstLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 5,
  keyGenerator: perUser,
  handler: tooMany('You are asking too fast. Wait a minute and try again.'),
});
const aiDailyLimiter = rateLimit({
  ...base,
  windowMs: 24 * 60 * 60 * 1000,
  limit: 40,
  keyGenerator: perUser,
  handler: tooMany('Daily AI limit reached. Try again tomorrow.'),
});

module.exports = { apiLimiter, authLimiter, loginLimiter, aiBurstLimiter, aiDailyLimiter };