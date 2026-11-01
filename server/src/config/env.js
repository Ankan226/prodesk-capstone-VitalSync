require('dotenv').config({ quiet: true });
const { buildAllowedOrigins } = require('../utils/origins');

const required = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const nodeEnv = process.env.NODE_ENV || 'development';
const clientUrls = buildAllowedOrigins(process.env.CLIENT_URL || 'http://localhost:3000', nodeEnv);

if (nodeEnv === 'production' && clientUrls.length === 0) {
  console.error('CLIENT_URL must be set to your live frontend URL (for example https://your-app.vercel.app).');
}

module.exports = {
  nodeEnv,
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  clientUrls,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
};