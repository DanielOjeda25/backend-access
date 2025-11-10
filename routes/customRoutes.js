const express = require('express');
const router = express.Router();
const { getHoursByEmployee, getClientsWithMultipleProjects, getInvoicesByClient, getProjectsByEstado } = require('../controllers/customController');

// GET /api/custom/hours?id_empleado=5
router.get('/hours', getHoursByEmployee);
// GET /api/custom/clients-multi-projects
router.get('/clients-multi-projects', getClientsWithMultipleProjects);
// GET /api/custom/invoices-by-client?id_cliente=1
router.get('/invoices-by-client', getInvoicesByClient);
// GET /api/custom/projects-by-estado?Estado=Finalizado
router.get('/projects-by-estado', getProjectsByEstado);

module.exports = router;