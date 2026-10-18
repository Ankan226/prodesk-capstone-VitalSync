const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { checkoutSchema } = require('../validators/appointment.validators');
const { checkout, verify } = require('../controllers/payments.controller');

router.use(protect, requireRole('patient'));

router.post('/checkout', validate(checkoutSchema), checkout);
router.get('/verify', verify); // ?session_id=cs_test_...

module.exports = router;