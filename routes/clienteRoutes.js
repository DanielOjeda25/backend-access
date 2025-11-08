const express = require('express');
const router = express.Router();
const { listarClientes } = require('../controllers/clienteController');

router.get('/', listarClientes);

module.exports = router;