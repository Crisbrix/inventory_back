module.exports = async (req, res) => {
  try {
    console.log('=== DEBUG DATABASE CONNECTION ===');
    
    // Importar aquí para evitar errores de carga
    const { testConnection } = require('../config/database');
    const dbConnected = await testConnection();
    console.log('Database connected:', dbConnected);
    
    res.json({ 
      status: 'OK', 
      message: 'Debug endpoint working',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      error: 'Debug error',
      message: error.message,
      stack: error.stack
    });
  }
};
