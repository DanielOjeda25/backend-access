const { createListHandler } = require('./listControllerFactory');

const listarEmpleados = createListHandler('empleados', ['Id_empleados', 'Nombre', 'Apellido']);

module.exports = { listarEmpleados };
