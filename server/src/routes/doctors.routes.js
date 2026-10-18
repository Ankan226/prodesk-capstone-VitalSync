const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { listDoctors, getSlots } = require('../controllers/doctors.controller');

router.use(protect);
router.get('/', listDoctors);
router.get('/:id/slots', getSlots); 

module.exports = router;