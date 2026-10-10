/**
 * Middleware centralizado de manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    error: message,
    status: statusCode,
    timestamp: new Date().toISOString()
  });
};

module.exports = { errorHandler };
