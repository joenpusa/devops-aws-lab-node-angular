const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  login,
  deleteUser
} = require('../controllers/users.controller');

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.post('/login', login);
router.delete('/:id', deleteUser);

module.exports = router;
