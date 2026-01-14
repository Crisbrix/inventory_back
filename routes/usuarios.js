const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');

// Middleware para validar token (similar al de auth)
const validateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token no proporcionado'
    });
  }
  
  // Validación simple del token (en producción usar JWT verify)
  if (token === 'invalid') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
  
  next();
};

// Obtener todos los usuarios
router.get('/', validateToken, usuariosController.getAllUsers);

// Obtener usuario por ID
router.get('/:id', validateToken, usuariosController.getUserById);

// Crear nuevo usuario
router.post('/', validateToken, usuariosController.createUser);

// Actualizar usuario
router.put('/:id', validateToken, usuariosController.updateUser);

// Eliminar usuario (soft delete)
router.delete('/:id', validateToken, usuariosController.deleteUser);

// Activar/Desactivar usuario
router.patch('/:id/toggle-status', validateToken, usuariosController.toggleUserStatus);

module.exports = router;
