const { createListHandler } = require('./listControllerFactory');

const listarClientes = createListHandler('clientes', [
  'Id_cliente', 'Razon_social', 'Cuit', 'Direccion', 'Telefono', 'Email', 'Fecha_alta', 'Estado'
]);

module.exports = { listarClientes };