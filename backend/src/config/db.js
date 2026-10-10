const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexiones a MySQL optimizado para entornos Cloud
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'app_user',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'devopslab',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

module.exports = pool;
