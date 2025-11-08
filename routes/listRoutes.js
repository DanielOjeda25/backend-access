const express = require('express');
const router = express.Router();
const { listarTablaDinamica, ALLOWED_TABLES } = require('../controllers/dynamicListController');

// Endpoint raíz para verificar que el router está montado y listar tablas permitidas
router.get('/', (req, res) => {
  res.json({ tables: ALLOWED_TABLES });
});

router.get('/:table', listarTablaDinamica);

module.exports = router;