// Página: Peticiones personalizadas
// Funciones: listar empleados, consultar horas por empleado, proyectos por estado,
// facturas por cliente y tareas por empleado.

const empleadosSelect = document.getElementById('empleado-select');
const consultarBtn = document.getElementById('consultar');
const resultadoEl = document.getElementById('resultado');
const listarClientesBtn = document.getElementById('listar-clientes');
const resultadoClientesEl = document.getElementById('resultado-clientes');
const infoHorasBtn = document.getElementById('info-horas');
const infoClientesBtn = document.getElementById('info-clientes');
const infoFacturasBtn = document.getElementById('info-facturas');
const infoProyectosBtn = document.getElementById('info-proyectos');
const infoModal = document.getElementById('info-modal');
const infoModalClose = document.getElementById('info-modal-close');
const infoModalTitle = document.getElementById('info-modal-title');
const infoModalDesc = document.getElementById('info-modal-desc');
const infoModalCode = document.getElementById('info-modal-code');
const clienteSelect = document.getElementById('cliente-select');
const consultarFacturasBtn = document.getElementById('consultar-facturas');
const resultadoFacturasEl = document.getElementById('resultado-facturas');
const estadoSelect = document.getElementById('estado-select');
const consultarProyectosBtn = document.getElementById('consultar-proyectos');
const resultadoProyectosEl = document.getElementById('resultado-proyectos');
const empleadoTareasSelect = document.getElementById('empleado-tareas-select');
const consultarTareasBtn = document.getElementById('consultar-tareas');
const resultadoTareasEl = document.getElementById('resultado-tareas');
const infoTareasBtn = document.getElementById('info-tareas');
const costoMinSelect = document.getElementById('costo-min-select');
const consultarRecursosBtn = document.getElementById('consultar-recursos');
const resultadoRecursosEl = document.getElementById('resultado-recursos');
const infoRecursosBtn = document.getElementById('info-recursos');
// Botones de exportación por sección
const exportHorasBtn = document.getElementById('export-horas');
const exportClientesBtn = document.getElementById('export-clientes');
const exportFacturasBtn = document.getElementById('export-facturas');
const exportProyectosBtn = document.getElementById('export-proyectos');
const exportTareasBtn = document.getElementById('export-tareas');
const exportRecursosBtn = document.getElementById('export-recursos');
import { renderBoxTable, exportContainerToXLSX } from './custom-ui.js';
import {
  fetchEmpleados,
  consultarHoras,
  fetchClientesMultiProjects,
  fetchClientes,
  fetchFacturasByCliente,
  fetchProjectStatuses,
  fetchProyectosByEstado,
  fetchTareasByEmpleado,
  fetchRecursosByCosto,
} from './custom-service.js';
import { openInfoModal, initInfoModal } from './custom-modal.js';
import { initController } from './custom-controller.js';

// Tabla reutilizable: importada desde custom-ui.js
// fetchEmpleados movido a custom-service.js

// Exportadores XLSX por cajita
exportHorasBtn?.addEventListener('click', () => {
  exportContainerToXLSX(resultadoEl, 'Horas', 'horas-por-empleado');
});
exportClientesBtn?.addEventListener('click', () => {
  exportContainerToXLSX(resultadoClientesEl, 'Clientes', 'clientes-multiproyectos');
});
exportFacturasBtn?.addEventListener('click', () => {
  exportContainerToXLSX(resultadoFacturasEl, 'Facturas', 'facturas-por-cliente');
});
exportProyectosBtn?.addEventListener('click', () => {
  exportContainerToXLSX(resultadoProyectosEl, 'Proyectos', 'proyectos-por-estado');
});
exportTareasBtn?.addEventListener('click', () => {
  exportContainerToXLSX(resultadoTareasEl, 'Tareas', 'tareas-por-empleado');
});
exportRecursosBtn?.addEventListener('click', () => {
  exportContainerToXLSX(resultadoRecursosEl, 'Recursos', 'recursos-por-costo');
});

function renderEmpleados(empleados) {
  empleadosSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Seleccione un empleado...';
  empleadosSelect.appendChild(placeholder);

  empleados.forEach((e) => {
    const opt = document.createElement('option');
    opt.value = e?.Id_empleados ?? '';
    const nombre = `${e?.Nombre ?? ''} ${e?.Apellido ?? ''}`.trim();
    opt.textContent = nombre || 'Sin nombre';
    empleadosSelect.appendChild(opt);
  });

  // Poblar también el select de la tarjeta de tareas
  if (empleadoTareasSelect) {
    empleadoTareasSelect.innerHTML = '';
    const ph2 = document.createElement('option');
    ph2.value = '';
    ph2.textContent = 'Seleccione un empleado...';
    empleadoTareasSelect.appendChild(ph2);
    empleados.forEach((e) => {
      const opt2 = document.createElement('option');
      opt2.value = e?.Id_empleados ?? '';
      const nombre2 = `${e?.Nombre ?? ''} ${e?.Apellido ?? ''}`.trim();
      opt2.textContent = nombre2 || 'Sin nombre';
      empleadoTareasSelect.appendChild(opt2);
    });
  }
}

// consultarHoras movido a custom-service.js

function renderResultado(data) {
  const empleado = data?.Empleado ?? '-';
  const total = data?.Total_Horas ?? 0;
  renderBoxTable(resultadoEl, ['Empleado', 'Total horas'], [[empleado, total]]);
}

// init delegado al controlador

// listener delegado al controlador

// fetchClientesMultiProjects movido a custom-service.js

function renderClientesMulti(list) {
  resultadoClientesEl.innerHTML = '';
  if (!list.length) {
    resultadoClientesEl.textContent = 'No hay clientes con más de un proyecto.';
    return;
  }
  const rows = list.map((row) => {
    const nombre = row?.Nombre_Cliente || 'Sin nombre';
    const cantidad = Number(row?.Cantidad_Proyectos || 0);
    return [nombre, `${cantidad}`];
  });
  renderBoxTable(resultadoClientesEl, ['Cliente', 'Cantidad de proyectos'], rows);
}

// listener delegado al controlador

// fetchClientes movido a custom-service.js

function renderClientes(clientes) {
  clienteSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Seleccione un cliente...';
  clienteSelect.appendChild(placeholder);
  clientes.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c?.Id_cliente ?? '';
    opt.textContent = c?.Razon_social || 'Sin nombre';
    clienteSelect.appendChild(opt);
  });
}

// fetchFacturasByCliente movido a custom-service.js

function renderFacturas(list) {
  resultadoFacturasEl.innerHTML = '';
  if (!list.length) {
    resultadoFacturasEl.textContent = 'No hay facturas para el cliente seleccionado.';
    return;
  }
  const rows = list.map((row) => {
    const proyecto = row?.Nombre_proyecto || 'Sin proyecto';
    const fecha = row?.Fecha_emision || '-';
    const total = row?.Total != null ? row.Total : '-';
    return [proyecto, fecha, `$${total}`];
  });
  renderBoxTable(resultadoFacturasEl, ['Proyecto', 'Fecha emisión', 'Total'], rows);
}

// listener delegado al controlador

// fetchProjectStatuses movido a custom-service.js

function renderEstados(estados) {
  estadoSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Seleccione un estado...';
  estadoSelect.appendChild(placeholder);
  estados.forEach((estado) => {
    const opt = document.createElement('option');
    opt.value = estado;
    opt.textContent = estado;
    estadoSelect.appendChild(opt);
  });
}

// fetchProyectosByEstado movido a custom-service.js

function renderProyectos(list) {
  resultadoProyectosEl.innerHTML = '';
  if (!list.length) {
    resultadoProyectosEl.textContent = 'No hay proyectos para el estado seleccionado.';
    return;
  }
  const rows = list.map((row) => {
    const id = row?.Id_proyecto ?? '-';
    const nombre = row?.Nombre_proyecto || 'Sin nombre';
    const fecha = row?.Fecha_inicio || '-';
    const estado = row?.Estado || '-';
    return [id, nombre, fecha, estado];
  });
  renderBoxTable(resultadoProyectosEl, ['ID', 'Nombre proyecto', 'Fecha inicio', 'Estado'], rows);
}

// listener delegado al controlador

// fetchTareasByEmpleado movido a custom-service.js

function renderTareas(list) {
  resultadoTareasEl.innerHTML = '';
  if (!list.length) {
    resultadoTareasEl.textContent = 'No hay tareas para el empleado seleccionado.';
    return;
  }
  const rows = list.map((row) => {
    const id = row?.Id_tarea ?? '-';
    const nombre = row?.Nombre_tarea || 'Sin nombre';
    const estado = row?.Estado_Tarea || '-';
    const proyecto = row?.Nombre_proyecto || 'Sin proyecto';
    const empleado = row?.Empleado || '';
    return [id, nombre, estado, proyecto, empleado];
  });
  renderBoxTable(resultadoTareasEl, ['ID', 'Tarea', 'Estado', 'Proyecto', 'Empleado'], rows);
}

// listener delegado al controlador

// fetchRecursosByCosto movido a custom-service.js

function renderRecursos(list) {
  resultadoRecursosEl.innerHTML = '';
  if (!list.length) {
    resultadoRecursosEl.textContent = 'No hay recursos en el rango indicado.';
    return;
  }
  const rows = list.map((row) => {
    const nombre = row?.Nombre_recurso || 'Sin nombre';
    const tipo = row?.Tipo || '-';
    const costo = row?.Costo_mensual != null ? row.Costo_mensual : '-';
    return [nombre, tipo, `$${costo}`];
  });
  renderBoxTable(resultadoRecursosEl, ['Recurso', 'Tipo', 'Costo mensual'], rows);
}

// listener delegado al controlador

// Bootstrap: pasar dependencias al controlador
initController({
  empleadosSelect,
  consultarBtn,
  resultadoEl,
  listarClientesBtn,
  resultadoClientesEl,
  clienteSelect,
  consultarFacturasBtn,
  resultadoFacturasEl,
  estadoSelect,
  consultarProyectosBtn,
  resultadoProyectosEl,
  empleadoTareasSelect,
  consultarTareasBtn,
  resultadoTareasEl,
  costoMinSelect,
  consultarRecursosBtn,
  resultadoRecursosEl,
  infoHorasBtn,
  infoClientesBtn,
  infoFacturasBtn,
  infoProyectosBtn,
  infoTareasBtn,
  infoRecursosBtn,
  fetchEmpleados,
  consultarHoras,
  fetchClientes,
  fetchClientesMultiProjects,
  fetchFacturasByCliente,
  fetchProjectStatuses,
  fetchProyectosByEstado,
  fetchTareasByEmpleado,
  fetchRecursosByCosto,
  renderEmpleados,
  renderResultado,
  renderClientes,
  renderClientesMulti,
  renderFacturas,
  renderEstados,
  renderProyectos,
  renderTareas,
  renderRecursos,
  openInfoModal,
  initInfoModal,
});