const express = require('express');
const router = express.Router();
const rol = require('../middlewares/rol');

// SOLO ADMINISTRADOR
router.get('/admin', rol(['Administrador']), (req, res) => {
    res.json({ mensaje: 'Acceso permitido a Administrador' });
});

// ADMINISTRADOR Y GERENCIA
router.get('/reportes', rol(['Administrador','Gerencia']), (req, res) => {
    res.json({ mensaje: 'Acceso a reportes permitido' });
});

module.exports = router;
