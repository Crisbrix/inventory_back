const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
const corsOptions = {
  origin: [
    'http://localhost:4200', 
    'https://inventory-frond.vercel.app',
    'https://inventory-frond-ifg99lg2i-crisbrixs-projects.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rutas
const authRoutes = require('./routes/auth');
const productosRoutes = require('./routes/productos');
const movimientosRoutes = require('./routes/movimientos');
const alertasRoutes = require('./routes/alertas');
const ventasRoutes = require('./routes/ventas');

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/ventas', ventasRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando correctamente',
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

// Iniciar servidor
async function startServer() {
  // Probar conexión a la base de datos
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.log('⚠️  Advertencia: No se pudo conectar a la base de datos. El servidor iniciará de todas formas.');
  }

  const server = app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📡 API disponible en http://localhost:${PORT}/api`);
  });

  // Manejar errores del servidor
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Error: El puerto ${PORT} ya está en uso.`);
      console.error(`💡 Solución: Cierra el proceso que usa el puerto ${PORT} o usa otro puerto.`);
      process.exit(1);
    } else {
      console.error('❌ Error del servidor:', error);
      process.exit(1);
    }
  });
}

// Solo iniciar el servidor cuando se ejecute directamente (entorno local)
if (require.main === module) {
  startServer();
}

// Exportar para Vercel
module.exports = app;
