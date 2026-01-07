const express = require('express');
const router = express.Router();
const movimientosController = require('../controllers/movimientosController');

// Obtener todos los movimientos
router.get('/', movimientosController.getAll);

// Obtener movimientos de hoy
router.get('/hoy', movimientosController.getHoy);

// Obtener movimientos por tipo (ENTRADA/SALIDA/AJUSTE)
router.get('/tipo/:tipo', movimientosController.getByTipo);

// Obtener top 5 productos más movidos
router.get('/top-productos', movimientosController.getTopProductos);

// Obtener estadísticas de entradas vs salidas
router.get('/estadisticas/entradas-salidas', movimientosController.getEntradasSalidas);

// Obtener movimientos por tipo para gráfica
router.get('/estadisticas/por-tipo', movimientosController.getMovimientosPorTipo);

// Crear nuevo movimiento
router.post('/', movimientosController.create);

// Obtener movimientos por producto
router.get('/producto/:id', movimientosController.getByProducto);

module.exports = router;
