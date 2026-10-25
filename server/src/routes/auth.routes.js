const router = require('express').Router();
const { register, login, me } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { loginLimiter } = require('../middleware/rateLimiters');
const { registerSchema, loginSchema } = require('../validators/auth.validators');

router.post('/register', validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.get('/me', protect, me);

module.exports = router;