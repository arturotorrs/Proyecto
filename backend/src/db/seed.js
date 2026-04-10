require('dotenv').config();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function seed() {
  console.log('Iniciando seed de la base de datos SQLite...');

  // Crear tablas
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  console.log('Tablas creadas/verificadas.');

  // Insertar admin
  const adminHash = await bcrypt.hash('Admin123', 10);
  db.prepare(`
    INSERT OR IGNORE INTO users (nombre, email, password_hash, rol)
    VALUES (?, ?, ?, ?)
  `).run('Administrador IMSS', 'admin@imss.com', adminHash, 'admin');

  // Insertar usuario de prueba
  const userHash = await bcrypt.hash('Usuario123', 10);
  db.prepare(`
    INSERT OR IGNORE INTO users (nombre, email, password_hash, rol)
    VALUES (?, ?, ?, ?)
  `).run('Enfermero Pérez', 'usuario@imss.com', userHash, 'user');

  // Insertar usuario viewer de prueba
  const viewerHash = await bcrypt.hash('Visor123', 10);
  db.prepare(`
    INSERT OR IGNORE INTO users (nombre, email, password_hash, rol)
    VALUES (?, ?, ?, ?)
  `).run('Visor IMSS', 'visor@imss.com', viewerHash, 'viewer');

  console.log('Usuarios creados.');

  // Insertar 5 insumos médicos
  const insumos = [
    {
      nombre: 'Vendajes Elásticos',
      descripcion: 'Vendaje elástico autoadherible 10cm x 4.5m para inmovilización y compresión',
      cantidad: 150,
      ubicacion: 'Almacén A - Estante 1',
      fecha_caducidad: '2026-12-31',
      codigo: 'VE-001',
    },
    {
      nombre: 'Gasas Estériles',
      descripcion: 'Gasa estéril 10x10cm, paquete de 10 unidades, para curaciones y apósitos',
      cantidad: 8,
      ubicacion: 'Almacén A - Estante 2',
      fecha_caducidad: '2025-06-30',
      codigo: 'GE-002',
    },
    {
      nombre: 'Jeringas 5ml',
      descripcion: 'Jeringa desechable de 5ml con aguja 21G para administración de medicamentos',
      cantidad: 200,
      ubicacion: 'Almacén B - Estante 3',
      fecha_caducidad: '2027-03-15',
      codigo: 'JE-003',
    },
    {
      nombre: 'Guantes Quirúrgicos',
      descripcion: 'Guantes de látex estériles talla M para procedimientos quirúrgicos',
      cantidad: 5,
      ubicacion: 'Almacén B - Estante 1',
      fecha_caducidad: '2026-08-20',
      codigo: 'GQ-004',
    },
    {
      nombre: 'Alcohol Antiséptico',
      descripcion: 'Alcohol etílico 70% en frasco de 500ml para antisepsia de piel',
      cantidad: 45,
      ubicacion: 'Almacén C - Estante 2',
      fecha_caducidad: '2025-09-10',
      codigo: 'AA-005',
    },
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO insumos (nombre, descripcion, cantidad, ubicacion, fecha_registro, fecha_caducidad, codigo)
    VALUES (?, ?, ?, ?, date('now'), ?, ?)
  `);

  for (const i of insumos) {
    stmt.run(i.nombre, i.descripcion, i.cantidad, i.ubicacion, i.fecha_caducidad, i.codigo);
  }

  console.log('Insumos creados.');
  console.log('\nSeed completado exitosamente.');
  console.log('-------------------------------');
  console.log('Admin:   admin@imss.com / Admin123');
  console.log('Usuario: usuario@imss.com / Usuario123');
  console.log('Viewer:  visor@imss.com / Visor123');
  console.log('-------------------------------');
  console.log(`Base de datos: ${db.name}`);
}

seed().catch((err) => {
  console.error('Error durante el seed:', err);
  process.exit(1);
});
