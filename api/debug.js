const { testConnection } = require('../config/database');

module.exports = async (req, res) => {
  try {
    console.log('=== DEBUG DATABASE CONNECTION ===');
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
