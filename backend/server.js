require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend DevOpsLab corriendo en el puerto ${PORT}`);
  console.log(`👉 Health check disponible en http://localhost:${PORT}/health`);
});

// Manejo de apagado elegante (Graceful Shutdown) para contenedores Docker
const shutdown = () => {
  console.log('Cerrando servidor HTTP...');
  server.close(() => {
    console.log('Servidor finalizado limpiamente.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
