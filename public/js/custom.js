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
import { renderBoxTable } from './custom-ui.js';

// Tabla reutilizable: importada desde custom-ui.js
async function fetchEmpleados() {
  const res = await fetch('/api/list/empleados');
  if (!res.ok) throw new Error('No se pudo listar empleados');
  const empleados = await res.json();
  return Array.isArray(empleados) ? empleados : [];
}

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

async function consultarHoras(idEmpleado) {
  const url = `/api/custom/hours?id_empleado=${encodeURIComponent(idEmpleado)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error en consulta de horas');
  const data = await res.json();
  return data;
}

function renderResultado(data) {
  const empleado = data?.Empleado ?? '-';
  const total = data?.Total_Horas ?? 0;
  renderBoxTable(resultadoEl, ['Empleado', 'Total horas'], [[empleado, total]]);
}

async function init() {
  try {
    const empleados = await fetchEmpleados();
    renderEmpleados(empleados);
    const clientes = await fetchClientes();
    renderClientes(clientes);
    const estados = await fetchProjectStatuses();
    renderEstados(estados);
  } catch (err) {
    resultadoEl.textContent = `Error cargando empleados: ${err?.message || err}`;
  }
}

consultarBtn.addEventListener('click', async () => {
  try {
    const selected = empleadosSelect.value;
    const id = selected;
    if (!id) {
      resultadoEl.textContent = 'Seleccione un empleado.';
      return;
    }
    const data = await consultarHoras(id);
    renderResultado(data);
  } catch (err) {
    resultadoEl.textContent = `Error en consulta: ${err?.message || err}`;
  }
});

async function fetchClientesMultiProjects() {
  const res = await fetch('/api/custom/clients-multi-projects');
  if (!res.ok) throw new Error('Error listando clientes con múltiples proyectos');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

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

listarClientesBtn.addEventListener('click', async () => {
  try {
    const list = await fetchClientesMultiProjects();
    renderClientesMulti(list);
  } catch (err) {
    resultadoClientesEl.textContent = `Error: ${err?.message || err}`;
  }
});

async function fetchClientes() {
  const res = await fetch('/api/clientes');
  if (!res.ok) throw new Error('No se pudo listar clientes');
  const clientes = await res.json();
  return Array.isArray(clientes) ? clientes : [];
}

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

async function fetchFacturasByCliente(idCliente) {
  const res = await fetch(`/api/custom/invoices-by-client?id_cliente=${encodeURIComponent(idCliente)}`);
  if (!res.ok) throw new Error('Error listando facturas del cliente');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

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

consultarFacturasBtn.addEventListener('click', async () => {
  try {
    const id = clienteSelect.value;
    if (!id) {
      resultadoFacturasEl.textContent = 'Seleccione un cliente.';
      return;
    }
    const list = await fetchFacturasByCliente(id);
    renderFacturas(list);
  } catch (err) {
    resultadoFacturasEl.textContent = `Error: ${err?.message || err}`;
  }
});

async function fetchProjectStatuses() {
  const res = await fetch('/api/list/proyectos');
  if (!res.ok) throw new Error('No se pudo listar proyectos');
  const proyectos = await res.json();
  const estados = new Set();
  (Array.isArray(proyectos) ? proyectos : []).forEach(p => {
    if (p && typeof p.Estado === 'string' && p.Estado.trim()) {
      estados.add(p.Estado.trim());
    }
  });
  return Array.from(estados).sort((a, b) => a.localeCompare(b));
}

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

async function fetchProyectosByEstado(estado) {
  const res = await fetch(`/api/custom/projects-by-estado?Estado=${encodeURIComponent(estado)}`);
  if (!res.ok) throw new Error('Error listando proyectos por estado');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

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

consultarProyectosBtn.addEventListener('click', async () => {
  try {
    const estado = estadoSelect.value;
    if (!estado) {
      resultadoProyectosEl.textContent = 'Seleccione un estado.';
      return;
    }
    const list = await fetchProyectosByEstado(estado);
    renderProyectos(list);
  } catch (err) {
    resultadoProyectosEl.textContent = `Error: ${err?.message || err}`;
  }
});

async function fetchTareasByEmpleado(idEmpleado) {
  const res = await fetch(`/api/custom/tasks-by-employee?id_empleado=${encodeURIComponent(idEmpleado)}`);
  if (!res.ok) throw new Error('Error listando tareas del empleado');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

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

consultarTareasBtn.addEventListener('click', async () => {
  try {
    const id = empleadoTareasSelect.value;
    if (!id) {
      resultadoTareasEl.textContent = 'Seleccione un empleado.';
      return;
    }
    const list = await fetchTareasByEmpleado(id);
    renderTareas(list);
  } catch (err) {
    resultadoTareasEl.textContent = `Error: ${err?.message || err}`;
  }
});

async function fetchRecursosByCosto(min, max) {
  const params = new URLSearchParams();
  params.set('min', String(min));
  if (Number.isFinite(max)) params.set('max', String(max));
  const url = `/api/custom/resources-by-cost?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error listando recursos por costo');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

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

consultarRecursosBtn.addEventListener('click', async () => {
  try {
    const val = (costoMinSelect.value || '').trim();
    if (!val) {
      resultadoRecursosEl.textContent = 'Seleccione un rango válido.';
      return;
    }
    let min, max = null;
    if (val.endsWith('+')) {
      min = Number(val.replace('+', ''));
    } else {
      const [a, b] = val.split('-');
      min = Number(a);
      max = Number(b);
    }
    if (!Number.isFinite(min) || min < 0 || (max !== null && !Number.isFinite(max))) {
      resultadoRecursosEl.textContent = 'Rango inválido. Seleccione una opción válida.';
      return;
    }
    const list = await fetchRecursosByCosto(min, max);
    renderRecursos(list);
  } catch (err) {
    resultadoRecursosEl.textContent = `Error: ${err?.message || err}`;
  }
});

function openInfoModal(type) {
  let title = '';
  let desc = '';
  let code = '';
  if (type === 'horas') {
    title = 'Consulta: Total de horas por empleado';
    desc = 'Consulta SQL del total de horas por un empleado específico:';
    code = `SELECT e.Nombre, e.Apellido, COALESCE(SUM(t.Horas_trabajadas), 0) AS Total_Horas\nFROM tiempo_de_desarrollo t\nINNER JOIN empleados e ON e.Id_empleados = t.Id_empleado\nWHERE t.Id_empleado = :Id_empleado\nGROUP BY e.Nombre, e.Apellido;`;
  } else if (type === 'clientes') {
    title = 'Muestra: Clientes con más de un proyecto';
    desc = 'Consulta SQL que obtiene razón social y cantidad de proyectos por cliente:';
    code = `SELECT c.Razon_social AS Nombre_Cliente, COUNT(p.Id_proyecto) AS Cantidad_Proyectos\nFROM proyectos p\nINNER JOIN clientes c ON c.Id_cliente = p.Id_cliente\nGROUP BY c.Id_cliente, c.Razon_social\nHAVING COUNT(p.Id_proyecto) > 1;`;
  } else if (type === 'facturas') {
    title = 'Consulta: Facturas por cliente (con proyecto)';
    desc = 'Consulta SQL que lista facturas del cliente y su proyecto:';
    code = `SELECT f.Id_factura, f.Fecha_emision, f.Total, c.Razon_social AS Cliente, p.Nombre_proyecto\nFROM factura_encabezado f\nINNER JOIN clientes c ON c.Id_cliente = f.Id_cliente\nINNER JOIN proyectos p ON p.Id_proyecto = f.Id_proyecto\nWHERE f.Id_cliente = :Id_cliente;`;
  } else if (type === 'proyectos') {
    title = 'Consulta: Proyectos por estado';
    desc = 'Consulta SQL que lista proyectos por estado, ordenados por fecha de inicio descendente:';
    code = `SELECT Id_proyecto, Nombre_proyecto, Fecha_inicio, Estado\nFROM Proyectos\nWHERE Estado = :Estado\nORDER BY Fecha_inicio DESC;`;
  } else if (type === 'tareas') {
    title = 'Consulta: Tareas por empleado';
    desc = 'Consulta SQL que lista las tareas del empleado con su proyecto:';
    code = `SELECT t.Id_tarea, t.Nombre_tarea, t.Estado AS Estado_Tarea, p.Nombre_proyecto, CONCAT(e.Nombre, ' ' , e.Apellido) AS Empleado\nFROM Tareas t\nINNER JOIN Proyectos p ON t.Id_proyecto = p.Id_proyecto\nINNER JOIN Empleados e ON t.Id_empleado = e.Id_empleados\nWHERE t.Id_empleado = :Id_empleado;`;
  } else if (type === 'recursos') {
    title = 'Consulta: Recursos por costo mensual';
    const val = (costoMinSelect?.value || '').trim();
    if (val && !val.endsWith('+')) {
      desc = 'Consulta SQL que lista recursos dentro de un rango de costo mensual:';
      code = `SELECT nombre_recurso, tipo, costo_mensual\nFROM Recursos\nWHERE costo_mensual > :Min AND costo_mensual < :Max\nORDER BY costo_mensual DESC;`;
    } else {
      desc = 'Consulta SQL que lista recursos con costo mensual superior al valor dado:';
      code = `SELECT nombre_recurso, tipo, costo_mensual\nFROM Recursos\nWHERE costo_mensual > :Min\nORDER BY costo_mensual DESC;`;
    }
  }
  infoModalTitle.textContent = title;
  infoModalDesc.textContent = desc;
  infoModalCode.textContent = code;
  infoModal.classList.remove('hidden');
}

function closeInfoModal() {
  infoModal.classList.add('hidden');
}

infoHorasBtn.addEventListener('click', () => openInfoModal('horas'));
infoClientesBtn.addEventListener('click', () => openInfoModal('clientes'));
infoFacturasBtn.addEventListener('click', () => openInfoModal('facturas'));
infoProyectosBtn.addEventListener('click', () => openInfoModal('proyectos'));
infoTareasBtn.addEventListener('click', () => openInfoModal('tareas'));
infoRecursosBtn.addEventListener('click', () => openInfoModal('recursos'));
infoModalClose.addEventListener('click', closeInfoModal);
infoModal.addEventListener('click', (e) => {
  if (e.target === infoModal) closeInfoModal();
});

init();