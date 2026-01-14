module.exports = async (req, res) => {
  try {
    console.log('=== DATABASE TEST ===');
    
    // Importar aquí para evitar errores
    const mysql = require('mysql2/promise');
    
    const config = {
      host: 'gateway01.us-east-1.prod.aws.tidbcloud.com',
      user: '1TEoM8obiKCAeP5.root',
      password: 'fDs0REMWAHVieQO8',
      database: 'inventary',
      port: 4000,
      ssl: { 
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      }
    };
    
    const connection = await mysql.createConnection(config);
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as time');
    await connection.end();
    
    res.json({ 
      status: 'OK', 
      message: 'Database connection successful',
      database: 'connected',
      testResult: rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      error: 'Database connection failed',
      message: error.message,
      stack: error.stack
    });
  }
};
