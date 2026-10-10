const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// Listar usuarios (sin exponer password_hash)
const getUsers = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// Obtener usuario por ID
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// Crear usuario con hashing seguro (bcrypt) y UUID
const createUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Campos requeridos: name, email, password' });
    }

    // Verificar si el email ya existe
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'El correo electrónico ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = crypto.randomUUID();

    await pool.query(
      'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
      [id, name, email, passwordHash]
    );

    res.status(201).json({
      id,
      name,
      email,
      message: 'Usuario registrado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// Autenticación básica de usuario (Login)
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Campos requeridos: email, password' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    res.json({
      message: 'Autenticación exitosa',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar usuario
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado exitosamente', id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  login,
  deleteUser
};
