const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_cambiar_en_produccion';

const authController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email/usuario y contraseña son requeridos'
        });
      }

      // Buscar usuario por correo (la tabla usa 'correo')
      const [user] = await query(
        'SELECT * FROM usuarios WHERE correo = ?',
        [email]
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar que el usuario esté activo
      if (!user.activo) {
        return res.status(401).json({
          success: false,
          message: 'Usuario inactivo'
        });
      }

      // La tabla usa 'contrasena', no 'password'
      const userPassword = user.contrasena;
      
      // Verificar contraseña (si está hasheada)
      // Si la contraseña no está hasheada, comparar directamente
      let passwordValid = false;
      
      // Intentar verificar con bcrypt primero
      try {
        passwordValid = await bcrypt.compare(password, userPassword);
      } catch (e) {
        // Si falla, comparar directamente (para desarrollo)
        passwordValid = userPassword === password;
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
          correo: user.correo,
          rol: user.rol
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // No enviar la contraseña en la respuesta
      const userResponse = {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol
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

  async register(req, res) {
    try {
      console.log('🔍 Register - req.body:', req.body);
      
      // Manejo seguro de req.body
      const body = req.body || {};
      const { nombre, correo, email, password } = body;
      const correoInput = correo || email; // aceptar ambos nombres de campo

      console.log('🔍 Register - datos extraídos:', { nombre, correoInput, password: password ? '***' : undefined });

      // Validar campos requeridos
      if (!nombre || !correoInput || !password) {
        console.log('❌ Validación fallida - Campos faltantes:', { nombre: !!nombre, correoInput: !!correoInput, password: !!password });
        return res.status(400).json({
          success: false,
          message: 'Nombre, correo y contraseña son requeridos'
        });
      }

      // Validar formato de email básico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correoInput)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de correo inválido'
        });
      }

      // Validar longitud de contraseña
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }

      // Verificar si el correo ya existe
      const [existingUser] = await query(
        'SELECT id FROM usuarios WHERE correo = ?',
        [correoInput]
      );

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El correo ya está registrado'
        });
      }

      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insertar nuevo usuario
      const result = await query(
        'INSERT INTO usuarios (nombre, correo, contrasena, activo) VALUES (?, ?, ?, ?)',
        [nombre, correoInput, hashedPassword, true]
      );

      // Obtener el usuario creado
      const [newUser] = await query(
        'SELECT id, nombre, correo, activo, fecha_creacion FROM usuarios WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        user: newUser
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error al registrar usuario',
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
      const [user] = await query(
        'SELECT id, nombre, correo, rol, activo, fecha_creacion FROM usuarios WHERE id = ?',
        [decoded.id]
      );

      if (!user || !user.activo) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado o inactivo'
        });
      }

      res.json({
        success: true,
        user: user
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
