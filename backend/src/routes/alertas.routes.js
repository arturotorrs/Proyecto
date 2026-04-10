const router = require('express').Router();
const { getAll, upsert, upsertBulk, remove } = require('../controllers/alertas.controller');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

router.get('/', verifyToken, getAll);
router.post('/', verifyToken, upsert);
router.post('/bulk', verifyToken, upsertBulk);
router.delete('/:id', verifyToken, requireRole('admin'), remove);

module.exports = router;
