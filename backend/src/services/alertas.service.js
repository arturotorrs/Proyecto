const cron = require('node-cron');
const db = require('../config/db');
const { getIO } = require('../socket');

const lastChecked = new Map();

function toMs(valor, unidad) {
  const map = { minutos: 60_000, horas: 3_600_000, dias: 86_400_000 };
  return valor * (map[unidad] || 86_400_000);
}

function checkAlertas() {
  try {
    const configs = db.prepare(`
      SELECT ac.id, ac.user_id, ac.insumo_id, ac.limite_stock, ac.dias_caducidad,
             ac.frecuencia_valor, ac.frecuencia_unidad,
             i.nombre AS insumo_nombre, i.cantidad, i.fecha_caducidad
      FROM alertas_config ac
      JOIN insumos i ON ac.insumo_id = i.id
    `).all();

    const now = Date.now();

    for (const cfg of configs) {
      const intervalo = toMs(cfg.frecuencia_valor, cfg.frecuencia_unidad);
      const lastTime = lastChecked.get(cfg.id) || 0;
      if (now - lastTime < intervalo) continue;

      lastChecked.set(cfg.id, now);

      const room = `user:${cfg.user_id}`;

      if (cfg.cantidad === 0) {
        getIO().to(room).emit('alerta:stock_critico', {
          insumo_id: cfg.insumo_id,
          nombre: cfg.insumo_nombre,
          cantidad: cfg.cantidad,
          mensaje: `CRÍTICO: ${cfg.insumo_nombre} sin existencias`,
        });
      } else if (cfg.cantidad <= cfg.limite_stock) {
        getIO().to(room).emit('alerta:stock_bajo', {
          insumo_id: cfg.insumo_id,
          nombre: cfg.insumo_nombre,
          cantidad: cfg.cantidad,
          limite_stock: cfg.limite_stock,
          mensaje: `Stock bajo: ${cfg.insumo_nombre} (${cfg.cantidad} unidades)`,
        });
      }

      if (cfg.fecha_caducidad && cfg.dias_caducidad > 0) {
        const diasRestantes = Math.ceil(
          (new Date(cfg.fecha_caducidad) - new Date()) / 86_400_000
        );
        if (diasRestantes <= cfg.dias_caducidad && diasRestantes >= 0) {
          getIO().to(room).emit('alerta:caducidad', {
            insumo_id: cfg.insumo_id,
            nombre: cfg.insumo_nombre,
            fecha_caducidad: cfg.fecha_caducidad,
            dias_restantes: diasRestantes,
            mensaje: `Caducidad próxima: ${cfg.insumo_nombre} caduca en ${diasRestantes} día(s)`,
          });
        }
      }
    }
  } catch (err) {
    console.error('Error en servicio de alertas:', err);
  }
}

function startAlertasService() {
  cron.schedule('* * * * *', checkAlertas);
  console.log('Servicio de alertas iniciado (cron cada minuto)');
}

module.exports = { startAlertasService };
