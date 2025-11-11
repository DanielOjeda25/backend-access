// Controlador de la vista custom: inicializa selects y registra listeners
// Recibe dependencias para evitar acoplamiento y facilitar pruebas.
import { parseCostoRange, errorMessage } from './utils.js';

export function initController({
  // DOM
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
  // Servicios
  fetchEmpleados,
  consultarHoras,
  fetchClientes,
  fetchClientesMultiProjects,
  fetchFacturasByCliente,
  fetchProjectStatuses,
  fetchProyectosByEstado,
  fetchTareasByEmpleado,
  fetchRecursosByCosto,
  // Renderers
  renderEmpleados,
  renderResultado,
  renderClientes,
  renderClientesMulti,
  renderFacturas,
  renderEstados,
  renderProyectos,
  renderTareas,
  renderRecursos,
  // Modal
  openInfoModal,
  initInfoModal,
}) {
  // Inicialización de selects iniciales
  (async () => {
    try {
      const empleados = await fetchEmpleados();
      renderEmpleados(empleados);
      const clientes = await fetchClientes();
      renderClientes(clientes);
      const estados = await fetchProjectStatuses();
      renderEstados(estados);
    } catch (err) {
      resultadoEl.textContent = `Error cargando datos iniciales: ${errorMessage(err)}`;
    }
  })();

  // Listeners de información (modal)
  infoHorasBtn.addEventListener('click', () => openInfoModal('horas'));
  infoClientesBtn.addEventListener('click', () => openInfoModal('clientes'));
  infoFacturasBtn.addEventListener('click', () => openInfoModal('facturas'));
  infoProyectosBtn.addEventListener('click', () => openInfoModal('proyectos'));
  infoTareasBtn.addEventListener('click', () => openInfoModal('tareas'));
  infoRecursosBtn.addEventListener('click', () => openInfoModal('recursos'));
  initInfoModal();

  // Listener: horas por empleado
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

  // Listener: clientes con múltiples proyectos
  listarClientesBtn.addEventListener('click', async () => {
    try {
      const list = await fetchClientesMultiProjects();
      renderClientesMulti(list);
    } catch (err) {
      resultadoClientesEl.textContent = `Error: ${err?.message || err}`;
    }
  });

  // Listener: facturas por cliente
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

  // Listener: proyectos por estado
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

  // Listener: tareas por empleado
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

  // Listener: recursos por costo mensual
  consultarRecursosBtn.addEventListener('click', async () => {
    try {
      const val = (costoMinSelect.value || '').trim();
      const parsed = parseCostoRange(val);
      if (!parsed) {
        resultadoRecursosEl.textContent = 'Rango inválido. Seleccione una opción válida.';
        return;
      }
      const { min, max } = parsed;
      const list = await fetchRecursosByCosto(min, max);
      renderRecursos(list);
    } catch (err) {
      resultadoRecursosEl.textContent = `Error: ${errorMessage(err)}`;
    }
  });
}