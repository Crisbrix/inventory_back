const express = require('express');
const router = express.Router();
const alertasController = require('../controllers/alertasController');

// Obtener todas las alertas
router.get('/', alertasController.getAll);

// Obtener alertas activas (no atendidas)
router.get('/activas', alertasController.getActivas);

// Obtener alertas por producto
router.get('/producto/:id', alertasController.getByProducto);

// Marcar alerta como atendida
router.put('/:id/atender', alertasController.marcarAtendida);

// Crear nueva alerta
router.post('/', alertasController.create);

// Eliminar alerta
router.delete('/:id', alertasController.delete);

module.exports = router;
