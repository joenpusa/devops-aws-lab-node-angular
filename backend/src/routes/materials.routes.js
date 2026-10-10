const express = require('express');
const router = express.Router();
const {
  getMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial
} = require('../controllers/materials.controller');

router.get('/', getMaterials);
router.get('/:id', getMaterialById);
router.post('/', createMaterial);
router.put('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);

module.exports = router;
