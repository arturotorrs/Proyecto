function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (req.user.rol !== role) {
      return res.status(403).json({ error: 'Acceso denegado: se requiere rol ' + role });
    }
    next();
  };
}

module.exports = { requireRole };
