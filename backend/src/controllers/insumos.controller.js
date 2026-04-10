const db = require('../config/db');
const { getIO } = require('../socket');

function getAll(req, res) {
  const { search } = req.query;
  try {
    let rows;
    if (search && search.trim()) {
      const like = `%${search.trim()}%`;
      rows = db.prepare(`
        SELECT id, nombre, descripcion, cantidad, ubicacion,
               fecha_registro, fecha_caducidad, codigo, created_at, updated_at
        FROM insumos
        WHERE nombre LIKE ? OR codigo LIKE ? OR ubicacion LIKE ?
        ORDER BY nombre ASC
      `).all(like, like, like);
    } else {
      rows = db.prepare(`
        SELECT id, nombre, descripcion, cantidad, ubicacion,
               fecha_registro, fecha_caducidad, codigo, created_at, updated_at
        FROM insumos
        ORDER BY nombre ASC
      `).all();
    }
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener insumos:', err);
    res.status(500).json({ error: 'Error al obtener insumos' });
  }
}

function getOne(req, res) {
  const { id } = req.params;
  try {
    const row = db.prepare('SELECT * FROM insumos WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ error: 'Insumo no encontrado' });
    res.json(row);
  } catch (err) {
    console.error('Error al obtener insumo:', err);
    res.status(500).json({ error: 'Error al obtener insumo' });
  }
}

function create(req, res) {
  const { nombre, descripcion, cantidad, ubicacion, fecha_registro, fecha_caducidad, codigo } = req.body;

  if (!nombre || !codigo) {
    return res.status(400).json({ error: 'Nombre y código son requeridos' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO insumos (nombre, descripcion, cantidad, ubicacion, fecha_registro, fecha_caducidad, codigo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      nombre.trim(),
      descripcion || null,
      cantidad ?? 0,
      ubicacion || null,
      fecha_registro || new Date().toISOString().split('T')[0],
      fecha_caducidad || null,
      codigo.trim().toUpperCase()
    );

    const insumo = db.prepare('SELECT * FROM insumos WHERE id = ?').get(info.lastInsertRowid);
    getIO().emit('inventario:actualizado', { accion: 'crear', insumo });
    res.status(201).json(insumo);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'El código del insumo ya existe' });
    }
    console.error('Error al crear insumo:', err);
    res.status(500).json({ error: 'Error al crear insumo' });
  }
}

function update(req, res) {
  const { id } = req.params;
  const { nombre, descripcion, cantidad, ubicacion, fecha_registro, fecha_caducidad, codigo } = req.body;

  if (!nombre || !codigo) {
    return res.status(400).json({ error: 'Nombre y código son requeridos' });
  }

  try {
    const info = db.prepare(`
      UPDATE insumos
      SET nombre = ?, descripcion = ?, cantidad = ?, ubicacion = ?,
          fecha_registro = ?, fecha_caducidad = ?, codigo = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      nombre.trim(),
      descripcion || null,
      cantidad,
      ubicacion || null,
      fecha_registro,
      fecha_caducidad || null,
      codigo.trim().toUpperCase(),
      id
    );

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }

    const insumo = db.prepare('SELECT * FROM insumos WHERE id = ?').get(id);
    getIO().emit('inventario:actualizado', { accion: 'editar', insumo });
    res.json(insumo);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'El código del insumo ya existe' });
    }
    console.error('Error al actualizar insumo:', err);
    res.status(500).json({ error: 'Error al actualizar insumo' });
  }
}

function remove(req, res) {
  const { id } = req.params;
  try {
    const movCheck = db.prepare(
      'SELECT id FROM movimientos WHERE insumo_id = ? LIMIT 1'
    ).get(id);

    if (movCheck) {
      return res.status(409).json({
        error: 'No se puede eliminar el insumo porque tiene movimientos registrados',
      });
    }

    const info = db.prepare('DELETE FROM insumos WHERE id = ?').run(id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }

    getIO().emit('inventario:actualizado', { accion: 'eliminar', insumoId: id });
    res.json({ message: 'Insumo eliminado exitosamente' });
  } catch (err) {
    console.error('Error al eliminar insumo:', err);
    res.status(500).json({ error: 'Error al eliminar insumo' });
  }
}

module.exports = { getAll, getOne, create, update, remove };
