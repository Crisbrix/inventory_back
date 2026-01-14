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

// Endpoint para dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const { query } = require('../config/database');
    
    // Stats simuladas por ahora
    const stats = {
      totalProductos: 150,
      stockBajo: 12,
      movimientosHoy: 8,
      alertasActivas: 3
    };
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Endpoint para movimientos de hoy
app.get('/api/movimientos/hoy', async (req, res) => {
  try {
    // Datos simulados por ahora
    const movimientos = [
      { id: 1, tipo: 'entrada', producto: 'Laptop Dell', cantidad: 5, hora: '09:30' },
      { id: 2, tipo: 'salida', producto: 'Mouse Logitech', cantidad: 3, hora: '10:15' },
      { id: 3, tipo: 'entrada', producto: 'Teclado HP', cantidad: 10, hora: '11:00' }
    ];
    
    res.json({
      success: true,
      data: movimientos,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Endpoint para alertas activas
app.get('/api/alertas/activas', async (req, res) => {
  try {
    // Datos simulados por ahora
    const alertas = [
      { id: 1, tipo: 'stock_bajo', producto: 'Laptop Dell', mensaje: 'Stock mínimo alcanzado', criticidad: 'alta' },
      { id: 2, tipo: 'stock_bajo', producto: 'Mouse USB', mensaje: 'Quedan 3 unidades', criticidad: 'media' },
      { id: 3, tipo: 'sin_movimientos', producto: 'Monitor LG', mensaje: 'Sin movimientos en 7 días', criticidad: 'baja' }
    ];
    
    res.json({
      success: true,
      data: alertas,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
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
    endpoints: [
      '/api/health',
      '/api/dashboard/stats',
      '/api/movimientos/hoy',
      '/api/alertas/activas'
    ],
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
