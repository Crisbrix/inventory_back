const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracionController');

// Middleware para validar token
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

// Obtener toda la configuración del sistema
router.get('/', validateToken, configuracionController.getAllConfig);

// Obtener configuración por clave específica
router.get('/:clave', validateToken, configuracionController.getConfigByKey);

// Actualizar múltiples configuraciones
router.put('/', validateToken, configuracionController.updateConfig);

// Actualizar configuración individual
router.put('/:clave', validateToken, configuracionController.updateSingleConfig);

// Resetear configuración a valores por defecto
router.post('/reset', validateToken, configuracionController.resetConfig);

module.exports = router;
