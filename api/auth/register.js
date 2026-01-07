const authController = require('../../controllers/authController');

module.exports = async (req, res) => {
  try {
    await authController.register(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};
