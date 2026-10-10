const pool = require('../config/db');

/**
 * Health Check: Valida estado del proceso y conectividad a MySQL.
 * Utilizado por ECS, ALB y Kubernetes como Liveness / Readiness probe.
 */
const getHealth = async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const [rows] = await pool.query('SELECT 1 as isAlive');
    if (rows && rows[0] && rows[0].isAlive === 1) {
      dbStatus = 'connected';
    }
  } catch (error) {
    dbStatus = 'error';
  }

  const isHealthy = dbStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    service: 'devopslab-backend',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    checks: {
      database: dbStatus
    }
  });
};

module.exports = {
  getHealth
};
