const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Middleware CORS para permitir el frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  next();
});

// Endpoint de login
app.post('/login', async (req, res) => {
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

// Exportar para Vercel
module.exports = (req, res) => app(req, res);
