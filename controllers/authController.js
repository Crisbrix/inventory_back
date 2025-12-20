const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'duvanesgay';

const authController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
      }

      // Buscar usuario por email
      const [user] = await query(
        'SELECT * FROM usuarios WHERE email = ?',
        [email]
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña (si está hasheada)
      // Si la contraseña no está hasheada, comparar directamente
      let passwordValid = false;
      
      // Intentar verificar con bcrypt primero
      try {
        passwordValid = await bcrypt.compare(password, user.password);
      } catch (e) {
        // Si falla, comparar directamente (para desarrollo)
        passwordValid = user.password === password;
      }

      if (!passwordValid) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Generar token JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          rol: user.rol || 'usuario' 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // No enviar la contraseña en la respuesta
      const userResponse = {
        id: user.id,
        email: user.email,
        nombre: user.nombre || user.name || 'Usuario',
        rol: user.rol || 'usuario'
      };

      res.json({
        success: true,
        token,
        user: userResponse
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error al iniciar sesión',
        error: error.message
      });
    }
  },

  async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token no proporcionado'
        });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Obtener usuario actualizado
      const [user] = await query('SELECT id, email, nombre, rol FROM usuarios WHERE id = ?', [decoded.id]);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        user
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
  }
};

module.exports = authController;

