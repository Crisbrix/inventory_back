const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión a la base de datos TiDB
const dbConfig = {
  host: process.env.DB_HOST || 'gateway01.us-east-1.prod.aws.tidbcloud.com',
  user: process.env.DB_USER || '1TEoM8obiKCAeP5.root',
  password: process.env.DB_PASSWORD || '8zJ63QzDXkjGR2qS',
  database: process.env.DB_NAME || 'inventary',
  port: process.env.DB_PORT || 4000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: true
  }
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión a MySQL establecida correctamente');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error al conectar a MySQL:', error.message);
    return false;
  }
}

// Función para ejecutar queries
async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Error ejecutando query:', error);
    throw error;
  }
}

module.exports = {
  pool,
  query,
  testConnection
};

