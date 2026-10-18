const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { requireApprovedDoctor } = require('../middleware/doctor.middleware');
const validate = require('../middleware/validate.middleware');
const { availabilitySchema } = require('../validators/appointment.validators');
const { getMine, saveMine } = require('../controllers/availability.controller');

router.use(protect, requireRole('doctor'), requireApprovedDoctor);

router.get('/me', getMine);
router.put('/me', validate(availabilitySchema), saveMine);

module.exports = router;