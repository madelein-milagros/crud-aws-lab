const mysql = require('mysql2');

// Pool de conexiones MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: 'root',
  password: 'LabMySQL2026!', // ⚠️ Recuerda esta contraseña
  database: 'crud_lab',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Adaptador para mantener compatibilidad con sqlite3 (callbacks)
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

// Inicializar BD y tablas al arrancar
pool.query(`CREATE DATABASE IF NOT EXISTS crud_lab`, () => {
  pool.query(`USE crud_lab`);
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
});

module.exports = db;