const express = require('express');
const cors = require('cors');
const { testConnection } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Configuración
const JWT_SECRET = process.env.JWT_SECRET || 'duvanesgay';

// Middleware
router.use(cors());
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Registro
router.post('/register', async (req, res) => {
  try {
    const { nombre, correo, password } = req.body;

    if (!nombre || !correo || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, correo y contraseña son requeridos'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de correo inválido'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar si el correo ya existe
    const [existingUser] = await testConnection().then(async () => {
      const { query } = require('../config/database');
      return await query('SELECT id FROM usuarios WHERE correo = ?', [correo]);
    });

    if (existingUser && existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El correo ya está registrado'
      });
    }

    // Hashear contraseña y registrar
    const hashedPassword = await bcrypt.hash(password, 10);
    const { query } = require('../config/database');
    const result = await query('INSERT INTO usuarios (nombre, correo, contrasena, activo) VALUES (?, ?, ?, ?)', 
      [nombre, correo, hashedPassword, true]);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      userId: result.insertId
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/usuario y contraseña son requeridos'
      });
    }

    const { query } = require('../config/database');
    const [user] = await query('SELECT * FROM usuarios WHERE correo = ?', [email]);

    if (!user || !user.activo) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    let passwordValid = false;
    try {
      passwordValid = await bcrypt.compare(password, user.contrasena);
    } catch (e) {
      passwordValid = user.contrasena === password;
    }

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const token = jwt.sign(
      { id: user.id, correo: user.correo, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
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
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

module.exports = router;
