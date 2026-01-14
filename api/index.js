const express = require('express');
const cors = require('cors');

const app = express();

// CORS
app.use(cors({
  origin: ['https://inventory-frond.vercel.app', 'http://localhost:4200', 'http://localhost:3000'],
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(express.json());

// Ruta raíz para Vercel
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Ruta de prueba
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Importar rutas principales
const authRoutes = require('../routes/auth');
const productosRoutes = require('../routes/productos');
const movimientosRoutes = require('../routes/movimientos');
const alertasRoutes = require('../routes/alertas');
const ventasRoutes = require('../routes/ventas');
const usuariosRoutes = require('../routes/usuarios');
const configuracionRoutes = require('../routes/configuracion');

// Usar todas las rutas
app.use('/auth', authRoutes);
app.use('/productos', productosRoutes);
app.use('/movimientos', movimientosRoutes);
app.use('/alertas', alertasRoutes);
app.use('/ventas', ventasRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/configuracion', configuracionRoutes);

module.exports = (req, res) => app(req, res);
