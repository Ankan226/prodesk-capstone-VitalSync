const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(protect);

router.get('/', (req, res) => {
  res.json({
    message: `Welcome, ${req.user.name}. This data came from a protected endpoint.`,
    role: req.user.role,
    serverTime: new Date().toISOString(),
  });
});

router.get('/admin', requireRole('admin'), (req, res) => res.json({ message: 'Admin area' }));

module.exports = router;