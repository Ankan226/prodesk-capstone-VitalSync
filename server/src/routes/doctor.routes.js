const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { requireApprovedDoctor } = require('../middleware/doctor.middleware');
const validate = require('../middleware/validate.middleware');
const { reapplySchema } = require('../validators/auth.validators');
const { reapply } = require('../controllers/doctor.controller');

router.use(protect, requireRole('doctor'));

router.put('/application', validate(reapplySchema), reapply);

router.get('/dashboard', requireApprovedDoctor, (req, res) => {
  res.json({
    message: `Welcome, ${req.user.name}. Your account is approved and this data came from a protected doctor endpoint.`,
    specialty: req.doctorProfile.specialty,
  });
});

module.exports = router;