const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { aiBurstLimiter, aiDailyLimiter } = require('../middleware/rateLimiters');
const { aiSuggestSchema } = require('../validators/ai.validators');
const { suggest } = require('../controllers/ai.controller');


router.use(protect, requireRole('patient'), aiBurstLimiter, aiDailyLimiter);
router.post('/suggest', validate(aiSuggestSchema), suggest);

module.exports = router;