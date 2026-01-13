const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');

const app = express();

// Middlewares
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
// Responder preflight de todos los endpoints
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rutas
const authRoutes = require('./routes/auth');
const productosRoutes = require('./routes/productos');
const movimientosRoutes = require('./routes/movimientos');
const alertasRoutes = require('./routes/alertas');
const ventasRoutes = require('./routes/ventas');

// Rutas con prefijo /api
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/ventas', ventasRoutes);

// Rutas sin prefijo /api (compatibilidad con reescrituras de Vercel)
app.use('/auth', authRoutes);
app.use('/productos', productosRoutes);
app.use('/movimientos', movimientosRoutes);
app.use('/alertas', alertasRoutes);
app.use('/ventas', ventasRoutes);

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

// Versión sin prefijo
app.get('/health', async (req, res) => {
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

// Exportar handler compatible con @vercel/node
module.exports = (req, res) => app(req, res);
