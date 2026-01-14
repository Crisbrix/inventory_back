module.exports = async (req, res) => {
  try {
    console.log('=== DEBUG DATABASE CONNECTION ===');
    
    // Test simple sin importar database
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
    const [rows] = await connection.execute('SELECT 1 as test');
    await connection.end();
    
    res.json({ 
      status: 'OK', 
      message: 'Debug endpoint working - direct connection successful',
      database: 'connected',
      testResult: rows,
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
