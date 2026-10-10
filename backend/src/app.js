const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/health.routes');
const materialsRoutes = require('./routes/materials.routes');
const usersRoutes = require('./routes/users.routes');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Registro de Rutas
app.use('/health', healthRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/users', usersRoutes);

// Manejador de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada', path: req.originalUrl });
});

// Middleware de errores global
app.use(errorHandler);

module.exports = app;
