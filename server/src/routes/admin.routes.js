const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { rejectSchema } = require('../validators/auth.validators');
const { listDoctors, approveDoctor, rejectDoctor } = require('../controllers/admin.controller');

router.use(protect, requireRole('admin'));

router.get('/doctors', listDoctors); 
router.patch('/doctors/:id/approve', approveDoctor);
router.patch('/doctors/:id/reject', validate(rejectSchema), rejectDoctor);

module.exports = router;