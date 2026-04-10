-- Sistema de Inventario de Insumos Médicos IMSS Traumatología
-- SQLite — ejecutar en orden por las FK

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'user' CHECK (rol IN ('admin', 'user', 'viewer')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS insumos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  cantidad INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  ubicacion TEXT,
  fecha_registro TEXT NOT NULL DEFAULT (date('now')),
  fecha_caducidad TEXT,
  codigo TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS movimientos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida')),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  nota TEXT,
  fecha TEXT NOT NULL DEFAULT (datetime('now')),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  insumo_id INTEGER NOT NULL REFERENCES insumos(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token     TEXT    NOT NULL UNIQUE,
  expires_at TEXT   NOT NULL,
  used      INTEGER NOT NULL DEFAULT 0,
  created_at TEXT   DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS alertas_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  insumo_id INTEGER NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  limite_stock INTEGER NOT NULL DEFAULT 10 CHECK (limite_stock >= 0),
  frecuencia_valor INTEGER NOT NULL DEFAULT 1 CHECK (frecuencia_valor > 0),
  frecuencia_unidad TEXT NOT NULL DEFAULT 'dias' CHECK (frecuencia_unidad IN ('minutos', 'horas', 'dias')),
  dias_caducidad INTEGER NOT NULL DEFAULT 30 CHECK (dias_caducidad >= 0),
  last_checked TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE (user_id, insumo_id)
);
