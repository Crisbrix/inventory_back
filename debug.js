require('dotenv').config();
const mysql = require('mysql2/promise');

console.log('=== DEBUG DATABASE CONNECTION ===');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'undefined');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);

const config = {
  host: process.env.DB_HOST || 'gateway01.us-east-1.prod.aws.tidbcloud.com',
  user: process.env.DB_USER || '1TEoM8obiKCAeP5.root',
  password: process.env.DB_PASSWORD || 'fDs0REMWAHVieQO8',
  database: process.env.DB_NAME || 'inventary',
  port: Number(process.env.DB_PORT) || 4000,
  ssl: { 
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  }
};

console.log('\n=== TESTING CONNECTION ===');
mysql.createConnection(config)
  .then(async conn => {
    console.log('✅ Connection successful!');
    const [rows] = await conn.execute('SELECT 1 as test');
    console.log('✅ Query successful:', rows);
    await conn.end();
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    console.error('❌ Error code:', err.code);
    console.error('❌ Error number:', err.errno);
  });
