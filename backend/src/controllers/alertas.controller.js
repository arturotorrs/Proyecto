const db = require('../config/db');

function getAll(req, res) {
  const user_id = req.user.id;
  try {
    const rows = db.prepare(`
      SELECT ac.*, i.nombre AS insumo_nombre, i.codigo AS insumo_codigo, i.cantidad AS insumo_cantidad
      FROM alertas_config ac
      JOIN insumos i ON ac.insumo_id = i.id
      WHERE ac.user_id = ?
      ORDER BY i.nombre ASC
    `).all(user_id);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener alertas:', err);
    res.status(500).json({ error: 'Error al obtener alertas' });
  }
}

function upsert(req, res) {
  const { insumo_id, limite_stock, frecuencia_valor, frecuencia_unidad, dias_caducidad } = req.body;
  const user_id = req.user.id;

  if (!insumo_id) {
    return res.status(400).json({ error: 'insumo_id es requerido' });
  }

  try {
    db.prepare(`
      INSERT INTO alertas_config (user_id, insumo_id, limite_stock, frecuencia_valor, frecuencia_unidad, dias_caducidad)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (user_id, insumo_id) DO UPDATE SET
        limite_stock = excluded.limite_stock,
        frecuencia_valor = excluded.frecuencia_valor,
        frecuencia_unidad = excluded.frecuencia_unidad,
        dias_caducidad = excluded.dias_caducidad,
        updated_at = datetime('now')
    `).run(
      user_id,
      insumo_id,
      limite_stock ?? 10,
      frecuencia_valor ?? 1,
      frecuencia_unidad ?? 'dias',
      dias_caducidad ?? 30
    );

    const row = db.prepare(
      'SELECT * FROM alertas_config WHERE user_id = ? AND insumo_id = ?'
    ).get(user_id, insumo_id);

    res.status(200).json(row);
  } catch (err) {
    console.error('Error al guardar alerta:', err);
    res.status(500).json({ error: 'Error al guardar configuración de alerta' });
  }
}

function upsertBulk(req, res) {
  // activar: configs a crear/actualizar; desactivar: insumo_ids a eliminar
  const { activar = [], desactivar = [] } = req.body;
  const user_id = req.user.id;

  if (!Array.isArray(activar) || !Array.isArray(desactivar)) {
    return res.status(400).json({ error: 'Formato de petición incorrecto' });
  }

  try {
    const upsertStmt = db.prepare(`
      INSERT INTO alertas_config (user_id, insumo_id, limite_stock, frecuencia_valor, frecuencia_unidad, dias_caducidad)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (user_id, insumo_id) DO UPDATE SET
        limite_stock = excluded.limite_stock,
        frecuencia_valor = excluded.frecuencia_valor,
        frecuencia_unidad = excluded.frecuencia_unidad,
        dias_caducidad = excluded.dias_caducidad,
        updated_at = datetime('now')
    `);

    const deleteStmt = db.prepare(
      'DELETE FROM alertas_config WHERE user_id = ? AND insumo_id = ?'
    );

    db.transaction(() => {
      for (const a of activar) {
        upsertStmt.run(
          user_id,
          a.insumo_id,
          a.limite_stock ?? 10,
          a.frecuencia_valor ?? 1,
          a.frecuencia_unidad ?? 'dias',
          a.dias_caducidad ?? 30
        );
      }
      for (const insumo_id of desactivar) {
        deleteStmt.run(user_id, insumo_id);
      }
    })();

    const results = db.prepare(
      'SELECT * FROM alertas_config WHERE user_id = ?'
    ).all(user_id);

    res.json(results);
  } catch (err) {
    console.error('Error al guardar alertas en bulk:', err);
    res.status(500).json({ error: 'Error al guardar configuraciones de alerta' });
  }
}

function remove(req, res) {
  const { id } = req.params;
  try {
    const info = db.prepare('DELETE FROM alertas_config WHERE id = ?').run(id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Configuración de alerta no encontrada' });
    }
    res.json({ message: 'Alerta eliminada exitosamente' });
  } catch (err) {
    console.error('Error al eliminar alerta:', err);
    res.status(500).json({ error: 'Error al eliminar alerta' });
  }
}

module.exports = { getAll, upsert, upsertBulk, remove };
