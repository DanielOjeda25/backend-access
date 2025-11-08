export const columnsByTable = {
  empleados: ['Id_empleados', 'Nombre', 'Apellido', 'Dni', 'Puesto', 'Email', 'Telefono', 'Fecha_ingreso', 'Estado'],
  clientes: ['Id_cliente', 'Razon_social', 'Cuit', 'Direccion', 'Telefono', 'Email', 'Fecha_alta', 'Estado'],
  proyectos: ['Id_proyecto', 'Id_cliente', 'Nombre_proyecto', 'Descripcion', 'Fecha_inicio', 'Fecha_fin_estimada', 'Estado', 'Presupuesto', 'Id_coordinador'],
  tareas: ['Id_tarea', 'Id_proyecto', 'Id_empleado', 'Nombre_tarea', 'Detalle', 'Fecha_asignacion', 'Fecha_entrega', 'Estado', 'Horas_estimadas'],
  tiempo_de_desarrollo: ['Id_tiempo', 'Id_tarea', 'Id_empleado', 'Fecha_registro', 'Horas_trabajadas', 'Observaciones'],
  recursos: ['Id_recurso', 'Nombre_recurso', 'Tipo', 'Costo_mensual', 'Id_proyecto', 'Observaciones'],
  factura_encabezado: ['Id_factura', 'Tipo_comprobante', 'Punto_venta', 'Nro_comprobante', 'Fecha_emision', 'Id_cliente', 'Id_proyecto', 'Condicion_venta', 'Subtotal', 'Iva', 'Total', 'Estado_pago'],
  factura_detalle: ['Id_detalle', 'Id_factura', 'Descripcion', 'Cantidad', 'Precio_unitario', 'Alicuota_iva', 'Importe_neto', 'Importe_iva', 'Importe_total'],
};

export const allowedEnumFiltersByTable = {
  empleados: ['Puesto', 'Estado'],
  clientes: ['Estado'],
  proyectos: ['Estado'],
  tareas: ['Estado'],
  tiempo_de_desarrollo: [],
  recursos: ['Tipo'],
  factura_encabezado: ['Tipo_comprobante', 'Condicion_venta', 'Estado_pago'],
  factura_detalle: ['Alicuota_iva'],
};

export const state = {
  cacheByTable: {},
  currentTable: null,
  currentFiltered: [],
  currentPage: 1,
  pageSize: 50,
  filtersByTable: {},
};

export function createState() {
  return {
    cacheByTable: {},
    currentTable: null,
    currentFiltered: [],
    currentPage: 1,
    pageSize: 50,
    filtersByTable: {},
  };
}