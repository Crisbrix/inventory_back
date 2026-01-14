const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares básicos
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configurado para frontend
app.use(cors({
  origin: ['https://inventory-frond.vercel.app', 'http://localhost:4200', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Ruta de prueba simple
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Simple test working',
    timestamp: new Date().toISOString()
  });
});

// Ruta health con base de datos
app.get('/api/health', async (req, res) => {
  try {
    // Importar aquí para evitar errores de carga
    const { testConnection } = require('../config/database');
    const dbConnected = await testConnection();
    res.json({ 
      status: 'OK', 
      message: 'Servidor funcionando correctamente',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al verificar base de datos',
      message: error.message
    });
  }
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API de Inventario funcionando',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message
  });
});

// Exportar para Vercel
module.exports = (req, res) => app(req, res);
