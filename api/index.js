const express = require('express');
const cors = require('cors');
const { testConnection } = require('../config/database');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rutas
const authRoutes = require('../routes/auth');
const productosRoutes = require('../routes/productos');
const movimientosRoutes = require('../routes/movimientos');
const alertasRoutes = require('../routes/alertas');
const ventasRoutes = require('../routes/ventas');

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/ventas', ventasRoutes);

// Ruta de prueba
app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando correctamente',
    database: dbConnected ? 'connected' : 'disconnected',
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
module.exports = app;
