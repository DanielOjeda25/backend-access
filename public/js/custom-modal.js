// Módulo de modal informativo para la vista custom
// Encapsula la lógica de apertura/cierre y el contenido dinámico del SQL.

const infoModal = document.getElementById('info-modal');
const infoModalClose = document.getElementById('info-modal-close');
const infoModalTitle = document.getElementById('info-modal-title');
const infoModalDesc = document.getElementById('info-modal-desc');
const infoModalCode = document.getElementById('info-modal-code');
const costoMinSelect = document.getElementById('costo-min-select');

export function openInfoModal(type) {
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

export function initInfoModal() {
  if (infoModalClose) {
    infoModalClose.addEventListener('click', closeInfoModal);
  }
  if (infoModal) {
    infoModal.addEventListener('click', (e) => {
      if (e.target === infoModal) closeInfoModal();
    });
  }
}