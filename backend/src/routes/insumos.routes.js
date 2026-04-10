const router = require('express').Router();
const { getAll, getOne, create, update, remove } = require('../controllers/insumos.controller');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, getOne);
router.post('/', verifyToken, requireRole('admin'), create);
router.put('/:id', verifyToken, requireRole('admin'), update);
router.delete('/:id', verifyToken, requireRole('admin'), remove);

module.exports = router;
