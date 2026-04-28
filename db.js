const path = require('path');

// Detectar entorno: si estamos en AWS (tiene variable DB_HOST), usar MySQL
const isAWS = process.env.DB_HOST && process.env.DB_HOST !== '127.0.0.1';

if (isAWS) {
  // ===== MODO AWS: MySQL =====
  const mysql = require('mysql2');
  
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'crud_lab',
    waitForConnections: true,
    connectionLimit: 10
  });

  const db = {
    run: (sql, params, callback) => {
      pool.query(sql, params, (err, results) => {
        if (callback) callback(err, { lastID: results.insertId, changes: results.affectedRows });
      });
    },
    get: (sql, params, callback) => {
      pool.query(sql, params, (err, results) => {
        if (callback) callback(err, results[0] || null);
      });
    },
    all: (sql, params, callback) => {
      pool.query(sql, params, (err, results) => {
        if (callback) callback(err, results || []);
      });
    }
  };

  // Crear tablas si no existen (solo en AWS)
  pool.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255)
  )`);
  pool.query(`CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    description TEXT
  )`);

  module.exports = db;

} else {
  // ===== MODO LOCAL: SQLite =====
  const sqlite3 = require('sqlite3').verbose();
  const DB_PATH = path.join(__dirname, 'app.db');
  const db = new sqlite3.Database(DB_PATH);

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      description TEXT
    )`);
  });

  module.exports = db;
}