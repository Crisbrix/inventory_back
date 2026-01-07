const authController = require('../../controllers/authController');

module.exports = async (req, res) => {
  try {
    await authController.login(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};
