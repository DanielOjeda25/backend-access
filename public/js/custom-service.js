// Servicio de datos para la vista custom
// Separa las funciones de acceso a API para mantener un patrón modular.

export async function fetchEmpleados() {
  const res = await fetch('/api/list/empleados');
  if (!res.ok) throw new Error('No se pudo listar empleados');
  const empleados = await res.json();
  return Array.isArray(empleados) ? empleados : [];
}

export async function consultarHoras(idEmpleado) {
  const url = `/api/custom/hours?id_empleado=${encodeURIComponent(idEmpleado)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error en consulta de horas');
  const data = await res.json();
  return data;
}

export async function fetchClientesMultiProjects() {
  const res = await fetch('/api/custom/clients-multi-projects');
  if (!res.ok) throw new Error('Error listando clientes con múltiples proyectos');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchClientes() {
  const res = await fetch('/api/clientes');
  if (!res.ok) throw new Error('No se pudo listar clientes');
  const clientes = await res.json();
  return Array.isArray(clientes) ? clientes : [];
}

export async function fetchFacturasByCliente(idCliente) {
  const res = await fetch(`/api/custom/invoices-by-client?id_cliente=${encodeURIComponent(idCliente)}`);
  if (!res.ok) throw new Error('Error listando facturas del cliente');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchProjectStatuses() {
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

export async function fetchProyectosByEstado(estado) {
  const res = await fetch(`/api/custom/projects-by-estado?Estado=${encodeURIComponent(estado)}`);
  if (!res.ok) throw new Error('Error listando proyectos por estado');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchTareasByEmpleado(idEmpleado) {
  const res = await fetch(`/api/custom/tasks-by-employee?id_empleado=${encodeURIComponent(idEmpleado)}`);
  if (!res.ok) throw new Error('Error listando tareas del empleado');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchRecursosByCosto(min, max) {
  const params = new URLSearchParams();
  params.set('min', String(min));
  if (Number.isFinite(max)) params.set('max', String(max));
  const url = `/api/custom/resources-by-cost?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error listando recursos por costo');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}