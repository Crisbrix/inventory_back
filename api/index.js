const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    const { query } = require('../config/database');

    // Logs para depuración
    console.log('POST /api/auth/register - Body:', req.body);
    console.log('POST /api/auth/register - Headers:', req.headers);

    // Validación más detallada
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      console.log('Error: Nombre inválido', nombre);
      return res.status(400).json({
        success: false,
        message: 'Nombre es requerido y debe ser un texto válido'
      });
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
      console.log('Error: Email inválido', email);
      return res.status(400).json({
        success: false,
        message: 'Email es requerido y debe ser un texto válido'
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      console.log('Error: Password inválido', password);
      return res.status(400).json({
        success: false,
        message: 'Password es requerido y debe tener al menos 6 caracteres'
      });
    }

    console.log('Validación pasada, verificando usuario existente...');

    // Verificar si el usuario ya existe (usando campo correo de la BD)
    const existingUserQuery = 'SELECT id FROM usuarios WHERE correo = ?';
    const [existingUser] = await query(existingUserQuery, [email]);

    if (existingUser) {
      console.log('Error: Usuario ya existe', email);
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado'
      });
    }

    console.log('Usuario no existe, procediendo con registro...');

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insertar usuario en la base de datos (usando campo correo)
    const insertQuery = `
      INSERT INTO usuarios (nombre, correo, contrasena, rol)
      VALUES (?, ?, ?, ?)
    `;
    
    console.log('Query:', insertQuery);
    console.log('Params:', [nombre, email, hashedPassword, rol]);
    
    const result = await query(insertQuery, [nombre, email, hashedPassword, rol]);
    
    console.log('Result:', result);

    // Obtener usuario creado (sin contraseña)
    const selectQuery = `
      SELECT id, nombre, correo, rol, activo, fecha_creacion 
      FROM usuarios 
      WHERE id = ?
    `;
    const [usuarioCreado] = await query(selectQuery, [result.insertId]);
    
    // Eliminar contraseña del response
    delete usuarioCreado.contrasena;
    
    console.log('Usuario creado exitosamente:', usuarioCreado);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: usuarioCreado
    });

  } catch (error) {
    console.error('Error en POST /api/auth/register:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message
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
    
    // Obtener estadísticas reales de la base de datos
    const totalProductosQuery = 'SELECT COUNT(*) as total FROM productos WHERE activo = 1';
    const stockBajoQuery = 'SELECT COUNT(*) as total FROM productos WHERE stock_actual <= stock_minimo AND activo = 1';
    const movimientosHoyQuery = 'SELECT COUNT(*) as total FROM movimientos_inventario WHERE DATE(fecha) = CURDATE()';
    const alertasActivasQuery = 'SELECT COUNT(*) as total FROM alertas WHERE atendida = FALSE';
    
    const [totalProductos] = await query(totalProductosQuery);
    const [stockBajo] = await query(stockBajoQuery);
    const [movimientosHoy] = await query(movimientosHoyQuery);
    const [alertasActivas] = await query(alertasActivasQuery);
    
    const stats = {
      totalProductos: totalProductos.total,
      stockBajo: stockBajo.total,
      movimientosHoy: movimientosHoy.total,
      alertasActivas: alertasActivas.total
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

// Endpoint para actualizar producto
app.put('/api/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, descripcion, precio, stock_actual, stock_minimo, activo } = req.body;
    const { query } = require('../config/database');
    
    // Logs para depuración
    console.log('PUT /api/productos/:id - ID:', id);
    console.log('PUT /api/productos/:id - Body:', req.body);
    
    // Validar campos requeridos
    if (!nombre || !precio === undefined || !stock_actual === undefined || !stock_minimo === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, precio, stock_actual y stock_minimo son requeridos'
      });
    }
    
    // Construir query dinámicamente solo con los campos proporcionados
    let updateFields = [];
    let updateValues = [];
    
    if (nombre !== undefined) {
      updateFields.push('nombre = ?');
      updateValues.push(nombre);
    }
    if (codigo !== undefined) {
      updateFields.push('codigo = ?');
      updateValues.push(codigo);
    }
    if (descripcion !== undefined) {
      updateFields.push('descripcion = ?');
      updateValues.push(descripcion);
    }
    if (precio !== undefined) {
      updateFields.push('precio = ?');
      updateValues.push(precio);
    }
    if (stock_actual !== undefined) {
      updateFields.push('stock_actual = ?');
      updateValues.push(stock_actual);
    }
    if (stock_minimo !== undefined) {
      updateFields.push('stock_minimo = ?');
      updateValues.push(stock_minimo);
    }
    if (activo !== undefined) {
      updateFields.push('activo = ?');
      updateValues.push(activo);
    }
    
    updateFields.push('fecha_actualizacion = CURRENT_TIMESTAMP');
    updateValues.push(id);
    
    const updateQuery = `
      UPDATE productos 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    console.log('Query:', updateQuery);
    console.log('Params:', updateValues);
    
    const result = await query(updateQuery, updateValues);
    
    console.log('Result:', result);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // Obtener producto actualizado
    const selectQuery = 'SELECT * FROM productos WHERE id = ?';
    const [productoActualizado] = await query(selectQuery, [id]);
    
    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: productoActualizado,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en PUT /api/productos/:id:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Endpoint para crear producto
app.post('/api/productos', async (req, res) => {
  try {
    const { nombre, codigo, descripcion, precio, stock_actual, stock_minimo } = req.body;
    const { query } = require('../config/database');
    
    // Logs para depuración
    console.log('POST /api/productos - Body:', req.body);
    
    // Validar campos requeridos
    if (!nombre || !precio === undefined || !stock_actual === undefined || !stock_minimo === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, precio, stock_actual y stock_minimo son requeridos'
      });
    }
    
    // Generar código automático si no se proporciona
    const codigoFinal = codigo || `PROD-${Date.now()}`;
    
    // Insertar nuevo producto
    const insertQuery = `
      INSERT INTO productos (nombre, codigo, descripcion, precio, stock_actual, stock_minimo)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    console.log('Query:', insertQuery);
    console.log('Params:', [nombre, codigoFinal, descripcion, precio, stock_actual, stock_minimo]);
    
    const result = await query(insertQuery, [nombre, codigoFinal, descripcion, precio, stock_actual, stock_minimo]);
    
    console.log('Result:', result);
    
    // Obtener producto creado
    const selectQuery = 'SELECT * FROM productos WHERE id = ?';
    const [productoCreado] = await query(selectQuery, [result.insertId]);
    
    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: productoCreado,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en POST /api/productos:', error);
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

// Endpoint para tendencia de ventas
app.get('/api/ventas/tendencia', async (req, res) => {
  try {
    const { periodo, anio, mes } = req.query;
    const { query } = require('../config/database');
    
    let tendenciaQuery = '';
    
    if (periodo === 'mes') {
      tendenciaQuery = `
        SELECT 
          DAY(v.fecha) as dia,
          SUM(v.total) as ventas,
          COUNT(vd.id) as productos
        FROM ventas v
        LEFT JOIN venta_detalle vd ON v.id = vd.venta_id
        WHERE YEAR(v.fecha) = ? AND MONTH(v.fecha) = ?
        GROUP BY DAY(v.fecha)
        ORDER BY dia
      `;
    } else if (periodo === 'semana') {
      tendenciaQuery = `
        SELECT 
          DAYNAME(v.fecha) as dia,
          SUM(v.total) as ventas,
          COUNT(vd.id) as productos
        FROM ventas v
        LEFT JOIN venta_detalle vd ON v.id = vd.venta_id
        WHERE YEARWEEK(v.fecha) = YEARWEEK(CURDATE())
        GROUP BY DAYNAME(v.fecha)
        ORDER BY FIELD(DAYNAME(v.fecha), 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
      `;
    } else if (periodo === 'anio') {
      tendenciaQuery = `
        SELECT 
          MONTHNAME(v.fecha) as mes,
          SUM(v.total) as ventas,
          COUNT(vd.id) as productos
        FROM ventas v
        LEFT JOIN venta_detalle vd ON v.id = vd.venta_id
        WHERE YEAR(v.fecha) = ?
        GROUP BY MONTH(v.fecha)
        ORDER BY MONTH(v.fecha)
      `;
    }
    
    let params = [];
    if (periodo === 'mes') {
      params = [anio, mes];
    } else if (periodo === 'anio') {
      params = [anio];
    }
    
    const tendencia = await query(tendenciaQuery, params);
    
    res.json({
      success: true,
      data: tendencia,
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
    const { query } = require('../config/database');
    
    let ventasQuery = '';
    
    if (periodo === 'mes') {
      ventasQuery = `
        SELECT 
          DATE(v.fecha) as fecha,
          COUNT(*) as productos,
          SUM(v.total) as total
        FROM ventas v
        WHERE YEAR(v.fecha) = ? AND MONTH(v.fecha) = ?
        GROUP BY DATE(v.fecha)
        ORDER BY fecha
      `;
    } else if (periodo === 'semana') {
      ventasQuery = `
        SELECT 
          DATE(v.fecha) as fecha,
          COUNT(*) as productos,
          SUM(v.total) as total
        FROM ventas v
        WHERE YEARWEEK(v.fecha) = YEARWEEK(CURDATE())
        GROUP BY DATE(v.fecha)
        ORDER BY fecha
      `;
    } else if (periodo === 'dia') {
      ventasQuery = `
        SELECT 
          HOUR(v.fecha) as hora,
          COUNT(*) as productos,
          SUM(v.total) as total
        FROM ventas v
        WHERE DATE(v.fecha) = CURDATE()
        GROUP BY HOUR(v.fecha)
        ORDER BY hora
      `;
    }
    
    let params = [];
    if (periodo === 'mes') {
      params = [anio, mes];
    }
    
    const ventas = await query(ventasQuery, params);
    
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
    const { query } = require('../config/database');
    
    // Obtener estadísticas reales de métodos de pago
    const metodosPagoQuery = `
      SELECT 
        metodo_pago as metodo,
        COUNT(*) as cantidad,
        SUM(total) as total
      FROM ventas
      GROUP BY metodo_pago
      ORDER BY total DESC
    `;
    
    const metodosPago = await query(metodosPagoQuery);
    
    // Calcular porcentajes
    const totalGeneral = metodosPago.reduce((sum, metodo) => sum + parseFloat(metodo.total), 0);
    
    const metodosConPorcentaje = metodosPago.map(metodo => ({
      ...metodo,
      porcentaje: parseFloat(((metodo.total / totalGeneral) * 100).toFixed(2))
    }));
    
    res.json({
      success: true,
      data: metodosConPorcentaje,
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
    const { query } = require('../config/database');
    
    // Obtener productos más vendidos
    const topProductosQuery = `
      SELECT 
        p.id,
        p.nombre,
        p.codigo,
        p.stock_actual,
        SUM(vd.cantidad) as ventas,
        SUM(vd.cantidad * vd.precio) as total
      FROM productos p
      LEFT JOIN venta_detalle vd ON p.id = vd.producto_id
      LEFT JOIN ventas v ON vd.venta_id = v.id
      GROUP BY p.id, p.nombre, p.codigo, p.stock_actual
      HAVING ventas > 0
      ORDER BY ventas DESC
      LIMIT 10
    `;
    
    const topProductos = await query(topProductosQuery);
    
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
    const { query } = require('../config/database');
    
    // Obtener movimientos reales del día
    const movimientosQuery = `
      SELECT mi.*, p.nombre as producto_nombre, p.codigo as producto_codigo
      FROM movimientos_inventario mi
      LEFT JOIN productos p ON mi.producto_id = p.id
      WHERE DATE(mi.fecha) = CURDATE()
      ORDER BY mi.fecha DESC
      LIMIT 10
    `;
    
    const movimientos = await query(movimientosQuery);
    
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
    const { query } = require('../config/database');
    
    // Obtener alertas reales no atendidas
    const alertasQuery = `
      SELECT a.*, p.nombre as producto_nombre, p.codigo as producto_codigo, p.stock_actual
      FROM alertas a
      LEFT JOIN productos p ON a.producto_id = p.id
      WHERE a.atendida = FALSE
      ORDER BY a.fecha DESC
      LIMIT 20
    `;
    
    const alertas = await query(alertasQuery);
    
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
      'POST /api/productos',
      'PUT /api/productos/:id',
      'GET /api/usuarios',
      'GET /api/configuracion',
      'GET /api/ventas/periodo',
      'GET /api/ventas/metodos-pago',
      'GET /api/ventas/top-productos',
      'GET /api/ventas/tendencia'
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
