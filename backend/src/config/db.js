const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/imss.db');

const db = new Database(dbPath);

// Activar WAL para mejor rendimiento y FK enforcement
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
