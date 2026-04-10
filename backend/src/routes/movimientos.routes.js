const router = require('express').Router();
const { getAll, create } = require('../controllers/movimientos.controller');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, getAll);
router.post('/', verifyToken, create);

module.exports = router;
