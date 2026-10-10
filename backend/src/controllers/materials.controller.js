const crypto = require('crypto');
const pool = require('../config/db');

// Listar todos los materiales
const getMaterials = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, description, price, image_key, created_by, created_at, updated_at FROM materials ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// Obtener un material por UUID
const getMaterialById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT id, name, description, price, image_key, created_by, created_at, updated_at FROM materials WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// Crear nuevo material con UUID nativo
const createMaterial = async (req, res, next) => {
  try {
    const { name, description, price, image_key, created_by } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Campos requeridos: name, price' });
    }

    const id = crypto.randomUUID();

    await pool.query(
      'INSERT INTO materials (id, name, description, price, image_key, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, description || null, price, image_key || null, created_by || null]
    );

    const [rows] = await pool.query('SELECT * FROM materials WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// Actualizar material
const updateMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, image_key } = req.body;

    const [existing] = await pool.query('SELECT id FROM materials WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }

    await pool.query(
      'UPDATE materials SET name = COALESCE(?, name), description = COALESCE(?, description), price = COALESCE(?, price), image_key = COALESCE(?, image_key) WHERE id = ?',
      [name, description, price, image_key, id]
    );

    const [updated] = await pool.query('SELECT * FROM materials WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    next(error);
  }
};

// Eliminar material
const deleteMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM materials WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }

    res.json({ message: 'Material eliminado exitosamente', id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial
};
