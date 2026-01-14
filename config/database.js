require('dotenv').config();

const mysql = require('mysql2/promise');

const useSSL = (process.env.DB_SSL || 'true').toString().toLowerCase() === 'true';

const dbConfig = {
  host: process.env.DB_HOST || 'gateway01.us-east-1.prod.aws.tidbcloud.com',
  user: process.env.DB_USER || '1TEoM8obiKCAeP5.root',
  password: process.env.DB_PASSWORD || 'fDs0REMWAHVieQO8',
  database: process.env.DB_NAME || 'inventary',
  port: Number(process.env.DB_PORT) || 4000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: useSSL ? { 
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  } : undefined
};

// Variable para almacenar el pool (lazy initialization)
let pool = null;

// Función para obtener el pool (crea solo cuando se necesita)
function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Función para probar la conexión
async function testConnection() {
  try {
    const connection = await getPool().getConnection();
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
    const [results] = await getPool().execute(sql, params);
    return results;
  } catch (error) {
    console.error('Error ejecutando query:', error);
    throw error;
  }
}

module.exports = {
  getPool,
  pool: getPool(), // Para compatibilidad con código existente
  query,
  testConnection
};

