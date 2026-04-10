const db = require("../config/db");
const { getIO } = require("../socket");

function getAll(req, res) {
  const { insumo_id } = req.query;
  try {
    let rows;
    if (insumo_id) {
      rows = db
        .prepare(
          `
        SELECT m.id, m.tipo, m.cantidad, m.nota, m.fecha,
               m.user_id, m.insumo_id,
               u.nombre AS usuario_nombre, u.rol AS usuario_rol,
               i.nombre AS insumo_nombre, i.codigo AS insumo_codigo,
               i.ubicacion AS insumo_ubicacion
        FROM movimientos m
        JOIN users u ON m.user_id = u.id
        JOIN insumos i ON m.insumo_id = i.id
        WHERE m.insumo_id = ?
        ORDER BY m.id DESC
        LIMIT 200
      `,
        )
        .all(insumo_id);
    } else {
      rows = db
        .prepare(
          `
        SELECT m.id, m.tipo, m.cantidad, m.nota, m.fecha,
               m.user_id, m.insumo_id,
               u.nombre AS usuario_nombre, u.rol AS usuario_rol,
               i.nombre AS insumo_nombre, i.codigo AS insumo_codigo,
               i.ubicacion AS insumo_ubicacion
        FROM movimientos m
        JOIN users u ON m.user_id = u.id
        JOIN insumos i ON m.insumo_id = i.id
        ORDER BY m.id DESC
        LIMIT 200
      `,
        )
        .all();
    }
    res.json(rows);
  } catch (err) {
    console.error("Error al obtener movimientos:", err);
    res.status(500).json({ error: "Error al obtener movimientos" });
  }
}

// Transacción sincrónica con better-sqlite3
const registrarMovimiento = db.transaction(
  (tipo, cantidad, nota, fecha, user_id, insumo_id, fecha_caducidad) => {
    const insumo = db
      .prepare("SELECT id, nombre, cantidad FROM insumos WHERE id = ?")
      .get(insumo_id);
    if (!insumo)
      throw Object.assign(new Error("Insumo no encontrado"), { status: 404 });

    if (tipo === "salida" && cantidad > insumo.cantidad) {
      throw Object.assign(
        new Error(
          `Existencia insuficiente. Disponible: ${insumo.cantidad}, solicitado: ${cantidad}`,
        ),
        { status: 400 },
      );
    }

    const movInfo = db
      .prepare(
        `
    INSERT INTO movimientos (tipo, cantidad, nota, fecha, user_id, insumo_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
      )
      .run(tipo, cantidad, nota || null, fecha, user_id, insumo_id);

    const delta = tipo === "entrada" ? cantidad : -cantidad;
    if (fecha_caducidad) {
      db.prepare(
        `
      UPDATE insumos SET cantidad = cantidad + ?, fecha_caducidad = ?, updated_at = datetime('now') WHERE id = ?
    `,
      ).run(delta, fecha_caducidad, insumo_id);
    } else {
      db.prepare(
        `
      UPDATE insumos SET cantidad = cantidad + ?, updated_at = datetime('now') WHERE id = ?
    `,
      ).run(delta, insumo_id);
    }

    const movimiento = db
      .prepare("SELECT * FROM movimientos WHERE id = ?")
      .get(movInfo.lastInsertRowid);
    const insumoActualizado = db
      .prepare("SELECT * FROM insumos WHERE id = ?")
      .get(insumo_id);

    return { movimiento, insumo: insumoActualizado };
  },
);

function create(req, res) {
  const { tipo, insumo_id, cantidad, nota, fecha, fecha_caducidad } = req.body;
  const user_id = req.user.id;

  if (!tipo || !insumo_id || !cantidad) {
    return res
      .status(400)
      .json({ error: "Tipo, insumo y cantidad son requeridos" });
  }
  if (!["entrada", "salida"].includes(tipo)) {
    return res
      .status(400)
      .json({ error: 'Tipo debe ser "entrada" o "salida"' });
  }
  if (cantidad <= 0 || !Number.isInteger(Number(cantidad))) {
    return res
      .status(400)
      .json({ error: "La cantidad debe ser un entero positivo" });
  }

  try {
    const fechaFinal = fecha
      ? String(fecha).slice(0, 16).replace("T", " ") + ":00"
      : new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
          .toISOString()
          .replace("T", " ")
          .slice(0, 19);

    const result = registrarMovimiento(
      tipo,
      Number(cantidad),
      nota,
      fechaFinal,
      user_id,
      insumo_id,
      fecha_caducidad || null,
    );

    getIO().emit("inventario:actualizado", {
      accion: "movimiento",
      insumo: result.insumo,
    });
    checkAndEmitAlertas(result.insumo);

    res.status(201).json(result);
  } catch (err) {
    const status = err.status || 500;
    const message =
      status < 500 ? err.message : "Error al registrar movimiento";
    if (status === 500) console.error("Error al registrar movimiento:", err);
    res.status(status).json({ error: message });
  }
}

function checkAndEmitAlertas(insumo) {
  try {
    const configs = db
      .prepare(
        "SELECT user_id, limite_stock FROM alertas_config WHERE insumo_id = ?",
      )
      .all(insumo.id);

    for (const cfg of configs) {
      const room = `user:${cfg.user_id}`;
      if (insumo.cantidad === 0) {
        getIO()
          .to(room)
          .emit("alerta:stock_critico", {
            insumo_id: insumo.id,
            nombre: insumo.nombre,
            cantidad: insumo.cantidad,
            mensaje: `CRÍTICO: ${insumo.nombre} sin existencias`,
          });
      } else if (insumo.cantidad <= cfg.limite_stock) {
        getIO()
          .to(room)
          .emit("alerta:stock_bajo", {
            insumo_id: insumo.id,
            nombre: insumo.nombre,
            cantidad: insumo.cantidad,
            limite_stock: cfg.limite_stock,
            mensaje: `Stock bajo: ${insumo.nombre} (${insumo.cantidad} unidades restantes)`,
          });
      }
    }
  } catch (err) {
    console.error("Error al verificar alertas:", err);
  }
}

module.exports = { getAll, create };
