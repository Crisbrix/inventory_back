const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware CORS para permitir el frontend
app.use(cors({
  origin: ['https://inventory-frond.vercel.app', 'http://localhost:4200', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Middleware para verificar JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token no proporcionado'
    });
  }

  try {
    const decoded = jwt.verify(token, 'tu_secreto_super_seguro_cambiar_en_produccion');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

// Endpoint de login temporal con GET para pruebas
app.get('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.query;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos como query params'
      });
    }

    // Importar conexión a base de datos
    const { query } = require('../config/database');
    
    // Buscar usuario en la base de datos
    const userQuery = 'SELECT * FROM usuarios WHERE correo = ? AND activo = 1';
    const users = await query(userQuery, [email]);
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o inactivo'
      });
    }

    const user = users[0];

    // Verificar contraseña
    const bcrypt = require('bcryptjs');
    const passwordMatch = await bcrypt.compare(password, user.contrasena);
    
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.correo, 
        rol: user.rol 
      },
      'tu_secreto_super_seguro_cambiar_en_produccion',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login exitoso (GET temporal)',
      data: {
        token,
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.correo,
          rol: user.rol
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message
    });
  }
});

// Endpoint de login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Usuario de prueba (simulado)
    const testUser = {
      id: 1,
      nombre: 'Administrador',
      email: 'admin@inventory.com',
      rol: 'ADMIN',
      contrasena: '$2a$10$YourHashedPasswordHere' // Hash de 'admin123'
    };

    // Verificar credenciales
    if (email !== testUser.email || password !== 'admin123') {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token
    const token = jwt.sign(
      { 
        id: testUser.id, 
        email: testUser.email, 
        rol: testUser.rol 
      },
      'tu_secreto_super_seguro_cambiar_en_produccion',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: testUser.id,
          nombre: testUser.nombre,
          email: testUser.email,
          rol: testUser.rol
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message
    });
  }
});

// Endpoint de registro
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombre, email, password, rol = 'VENDEDOR' } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // Simular registro (en producción guardar en BD)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    res.json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        id: Date.now(),
        nombre,
        email,
        rol
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message
    });
  }
});

// Endpoint para verificar token
app.get('/api/auth/verify', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token válido',
    data: {
      user: req.user
    }
  });
});

// Endpoint de prueba POST
app.post('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'POST test working',
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

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

// Endpoint para usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const { query } = require('../config/database');
    
    // Obtener usuarios de la base de datos
    const usuariosQuery = `
      SELECT id, nombre, correo, rol, activo, fecha_creacion
      FROM usuarios
      WHERE activo = 1
      ORDER BY nombre
    `;
    
    const usuarios = await query(usuariosQuery);
    
    res.json({
      success: true,
      data: usuarios,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Endpoint para configuración
app.get('/api/configuracion', async (req, res) => {
  try {
    // Configuración simulada por ahora
    const configuracion = {
      empresa: {
        nombre: 'Inventory System',
        nit: '900.123.456-7',
        direccion: 'Calle Principal #123',
        telefono: '+57 1 234 5678',
        email: 'contacto@inventory.com'
      },
      sistema: {
        nombre: 'Inventory Management System',
        version: '1.0.0',
        moneda: 'COP',
        idioma: 'es',
        timezone: 'America/Bogota'
      },
      alertas: {
        stock_minimo_porcentaje: 20,
        sin_movimientos_dias: 7,
        email_notificaciones: true
      }
    };
    
    res.json({
      success: true,
      data: configuracion,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Endpoint para ventas por período
app.get('/api/ventas/periodo', async (req, res) => {
  try {
    const { periodo, anio, mes } = req.query;
    
    // Datos simulados por ahora
    let ventas = [];
    
    if (periodo === 'mes') {
      ventas = [
        { id: 1, fecha: '2026-01-01', total: 1500000, productos: 5 },
        { id: 2, fecha: '2026-01-02', total: 2300000, productos: 8 },
        { id: 3, fecha: '2026-01-03', total: 1800000, productos: 6 },
        { id: 4, fecha: '2026-01-04', total: 3200000, productos: 12 },
        { id: 5, fecha: '2026-01-05', total: 2800000, productos: 9 }
      ];
    } else if (periodo === 'semana') {
      ventas = [
        { id: 1, fecha: '2026-01-13', total: 8500000, productos: 28 },
        { id: 2, fecha: '2026-01-14', total: 9200000, productos: 31 }
      ];
    } else if (periodo === 'dia') {
      ventas = [
        { id: 1, hora: '09:00', total: 1200000, productos: 4 },
        { id: 2, hora: '11:00', total: 2300000, productos: 7 },
        { id: 3, hora: '14:00', total: 1800000, productos: 6 },
        { id: 4, hora: '16:00', total: 3400000, productos: 11 }
      ];
    }
    
    res.json({
      success: true,
      data: ventas,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Endpoint para métodos de pago
app.get('/api/ventas/metodos-pago', async (req, res) => {
  try {
    // Datos simulados por ahora
    const metodosPago = [
      { metodo: 'Efectivo', total: 15000000, porcentaje: 45, cantidad: 45 },
      { metodo: 'Nequi', total: 8500000, porcentaje: 25, cantidad: 28 },
      { metodo: 'Tarjeta Crédito', total: 6800000, porcentaje: 20, cantidad: 15 },
      { metodo: 'Transferencia', total: 3300000, porcentaje: 10, cantidad: 8 }
    ];
    
    res.json({
      success: true,
      data: metodosPago,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Endpoint para top productos
app.get('/api/ventas/top-productos', async (req, res) => {
  try {
    // Datos simulados por ahora
    const topProductos = [
      { id: 1, nombre: 'Jean Clase A', ventas: 25, total: 22500000, stock: 10 },
      { id: 2, nombre: 'Camiseta Básica', ventas: 18, total: 9000000, stock: 25 },
      { id: 3, nombre: 'Pantalón Cargo', ventas: 15, total: 13500000, stock: 8 },
      { id: 4, nombre: 'Chaqueta Deportiva', ventas: 12, total: 18000000, stock: 5 },
      { id: 5, nombre: 'Zapatillas Running', ventas: 10, total: 15000000, stock: 3 }
    ];
    
    res.json({
      success: true,
      data: topProductos,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Endpoint para productos
app.get('/api/productos', async (req, res) => {
  try {
    const { query } = require('../config/database');
    
    // Obtener productos de la base de datos
    const productosQuery = `
      SELECT p.*, 
             CASE 
               WHEN p.stock_actual <= p.stock_minimo THEN 'CRITICO'
               WHEN p.stock_actual <= p.stock_minimo * 1.5 THEN 'BAJO'
               ELSE 'NORMAL'
             END as estado_stock
      FROM productos p
      WHERE p.activo = 1
      ORDER BY p.nombre
    `;
    
    const productos = await query(productosQuery);
    
    res.json({
      success: true,
      data: productos,
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
    version: '1.0.1',
    endpoints: [
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/auth/verify',
      'POST /api/test',
      '/api/health',
      '/api/dashboard/stats',
      '/api/movimientos/hoy',
      '/api/alertas/activas',
      'GET /api/productos',
      'GET /api/usuarios',
      'GET /api/configuracion',
      'GET /api/ventas/periodo',
      'GET /api/ventas/metodos-pago',
      'GET /api/ventas/top-productos'
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
