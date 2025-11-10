// Página: Peticiones personalizadas
// Funciones: listar empleados y consultar horas trabajadas por empleado

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
}

async function consultarHoras(idEmpleado) {
  const url = `/api/custom/hours?id_empleado=${encodeURIComponent(idEmpleado)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error en consulta de horas');
  const data = await res.json();
  return data;
}

function renderResultado(data) {
  // data: { id_empleado, Empleado, Total_Horas }
  resultadoEl.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'bg-gray-700 border border-gray-600 rounded-md p-3';
  const nombre = document.createElement('div');
  nombre.textContent = `Empleado: ${data?.Empleado ?? '-'}`;
  const total = document.createElement('div');
  total.textContent = `Total Horas: ${data?.Total_Horas ?? 0}`;
  box.appendChild(nombre);
  box.appendChild(total);
  resultadoEl.appendChild(box);
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
  const box = document.createElement('div');
  box.className = 'bg-gray-700 border border-gray-600 rounded-md p-3 space-y-1';
  list.forEach((row) => {
    const item = document.createElement('div');
    const nombre = row?.Nombre_Cliente || 'Sin nombre';
    const cantidad = Number(row?.Cantidad_Proyectos || 0);
    item.textContent = `${nombre} — ${cantidad} proyecto${cantidad === 1 ? '' : 's'}`;
    box.appendChild(item);
  });
  resultadoClientesEl.appendChild(box);
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
  const box = document.createElement('div');
  box.className = 'bg-gray-700 border border-gray-600 rounded-md p-3 space-y-1';
  list.forEach((row) => {
    const item = document.createElement('div');
    const proyecto = row?.Nombre_proyecto || 'Sin proyecto';
    const fecha = row?.Fecha_emision || '-';
    const total = row?.Total != null ? row.Total : '-';
    item.textContent = `${proyecto} — ${fecha} — Total: ${total}`;
    box.appendChild(item);
  });
  resultadoFacturasEl.appendChild(box);
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
  const box = document.createElement('div');
  box.className = 'bg-gray-700 border border-gray-600 rounded-md p-3 space-y-1';
  list.forEach((row) => {
    const item = document.createElement('div');
    const id = row?.Id_proyecto ?? '-';
    const nombre = row?.Nombre_proyecto || 'Sin nombre';
    const fecha = row?.Fecha_inicio || '-';
    const estado = row?.Estado || '-';
    item.textContent = `ID ${id} — ${nombre} — ${fecha} — ${estado}`;
    box.appendChild(item);
  });
  resultadoProyectosEl.appendChild(box);
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

function openInfoModal(type) {
  let title = '';
  let desc = '';
  let code = '';
  if (type === 'horas') {
    title = 'Consulta: Total de horas por empleado';
    desc = 'Consulta SQL del total de horas por un empleado específico:';
    code = `SELECT e."Nombre", e."Apellido", COALESCE(SUM(t."Horas_trabajadas"), 0) AS "Total_Horas"\nFROM "tiempo_de_desarrollo" t\nJOIN "empleados" e ON e."Id_empleados" = t."Id_empleado"\nWHERE t."Id_empleado" = <Id_empleado>\nGROUP BY e."Nombre", e."Apellido";`;
  } else if (type === 'clientes') {
    title = 'Muestra: Clientes con más de un proyecto';
    desc = 'Consulta SQL que obtiene razón social y cantidad de proyectos por cliente:';
    code = `SELECT c."Razon_social" AS "Nombre_Cliente", COUNT(p."Id_proyecto") AS "Cantidad_Proyectos"\nFROM "proyectos" p\nJOIN "clientes" c ON c."Id_cliente" = p."Id_cliente"\nGROUP BY c."Id_cliente", c."Razon_social"\nHAVING COUNT(p."Id_proyecto") > 1;`;
  } else if (type === 'facturas') {
    title = 'Consulta: Facturas por cliente (con proyecto)';
    desc = 'Consulta SQL que lista facturas del cliente y su proyecto:';
    code = `SELECT f."Id_factura", f."Fecha_emision", f."Total", c."Razon_social" AS "Cliente", p."Nombre_proyecto"\nFROM "factura_encabezado" f\nJOIN "clientes" c ON c."Id_cliente" = f."Id_cliente"\nJOIN "proyectos" p ON p."Id_proyecto" = f."Id_proyecto"\nWHERE f."Id_cliente" = <Id_cliente>;`;
  } else if (type === 'proyectos') {
    title = 'Consulta: Proyectos por estado';
    desc = 'Consulta SQL que lista proyectos por estado, ordenados por fecha de inicio descendente:';
    code = `SELECT p."Id_proyecto", p."Nombre_proyecto", p."Fecha_inicio", p."Estado"\nFROM "proyectos" p\nWHERE p."Estado" = <Estado>\nORDER BY p."Fecha_inicio" DESC;`;
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
infoModalClose.addEventListener('click', closeInfoModal);
infoModal.addEventListener('click', (e) => {
  if (e.target === infoModal) closeInfoModal();
});

init();