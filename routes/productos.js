const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');

// Obtener todos los productos
router.get('/', productosController.getAll);

// Obtener un producto por ID
router.get('/:id', productosController.getById);

// Crear un nuevo producto
router.post('/', productosController.create);

// Actualizar un producto
router.put('/:id', productosController.update);

// Eliminar un producto
router.delete('/:id', productosController.delete);

module.exports = router;



