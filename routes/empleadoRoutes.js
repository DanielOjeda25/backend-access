const express = require('express');
const router = express.Router();
const { listarEmpleados } = require('../controllers/empleadoController');

router.get('/', listarEmpleados);

module.exports = router;
