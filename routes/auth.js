const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registro
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// Verificar token
router.get('/verify', authController.verifyToken);

module.exports = router;

