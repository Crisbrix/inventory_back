const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');

// Obtener todas las ventas
router.get('/', ventasController.getAll);

// Obtener KPIs para dashboard y reportes
router.get('/kpis', ventasController.getKPIs);

// Obtener ventas por período para reportes
router.get('/periodo', ventasController.getVentasPorPeriodo);

// Obtener tendencia de ventas para gráfico de líneas
router.get('/tendencia', ventasController.getTendenciaVentas);

// Obtener ventas por categoría para reportes
router.get('/categorias', ventasController.getVentasPorCategoria);

// Obtener top productos más vendidos
router.get('/top-productos', ventasController.getTopProductos);

// Obtener ventas por método de pago
router.get('/metodos-pago', ventasController.getVentasPorMetodoPago);

// Obtener rotación de inventario para reportes
router.get('/rotacion-inventario', ventasController.getRotacionInventario);

// Obtener ventas por rango de fechas
router.get('/fechas', ventasController.getByFecha);

// Obtener venta por ID
router.get('/:id', ventasController.getById);

// Crear nueva venta
router.post('/', ventasController.create);

module.exports = router;
