const express = require('express');
const cors = require('cors');
const { testConnection } = require('../config/database');

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

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Simple test working',
    timestamp: new Date().toISOString()
  });
});

// Ruta simple debug sin dependencias
app.get('/api/simple2', require('./simple2'));

// Ruta debug para base de datos
app.get('/api/debug', require('./debug'));

// Ruta health con base de datos
app.get('/api/health', async (req, res) => {
  try {
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

// Importar rutas
const authRoutes = require('../routes/auth');
const productosRoutes = require('../routes/productos');
const movimientosRoutes = require('../routes/movimientos');
const alertasRoutes = require('../routes/alertas');
const ventasRoutes = require('../routes/ventas');
const usuariosRoutes = require('../routes/usuarios');
const configuracionRoutes = require('../routes/configuracion');

// Rutas con prefijo /api
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/configuracion', configuracionRoutes);

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
