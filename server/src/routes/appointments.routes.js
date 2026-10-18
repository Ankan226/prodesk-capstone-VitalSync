const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { createAppointmentSchema, updateAppointmentSchema } = require('../validators/appointment.validators');
const { create, list, getOne, update, remove } = require('../controllers/appointments.controller');

router.use(protect); 

router.post('/', requireRole('patient'), validate(createAppointmentSchema), create);
router.get('/', list);
router.get('/:id', getOne);
router.put('/:id', requireRole('patient'), validate(updateAppointmentSchema), update);
router.delete('/:id', requireRole('patient'), remove);

module.exports = router;