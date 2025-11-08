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

// Metadatos de claves foráneas para construir selects en los formularios
// labelColumn: columna a usar como etiqueta; labelColumns: múltiples columnas combinadas con espacio
export const foreignKeysByTable = {
  proyectos: {
    Id_cliente: { table: 'clientes', idColumn: 'Id_cliente', labelColumn: 'Razon_social' },
    Id_coordinador: { table: 'empleados', idColumn: 'Id_empleados', labelColumns: ['Nombre', 'Apellido'] },
  },
  tareas: {
    Id_proyecto: { table: 'proyectos', idColumn: 'Id_proyecto', labelColumn: 'Nombre_proyecto' },
    Id_empleado: { table: 'empleados', idColumn: 'Id_empleados', labelColumns: ['Nombre', 'Apellido'] },
  },
  tiempo_de_desarrollo: {
    Id_tarea: { table: 'tareas', idColumn: 'Id_tarea', labelColumn: 'Nombre_tarea' },
    Id_empleado: { table: 'empleados', idColumn: 'Id_empleados', labelColumns: ['Nombre', 'Apellido'] },
  },
  recursos: {
    Id_proyecto: { table: 'proyectos', idColumn: 'Id_proyecto', labelColumn: 'Nombre_proyecto' },
  },
  factura_encabezado: {
    Id_cliente: { table: 'clientes', idColumn: 'Id_cliente', labelColumn: 'Razon_social' },
    Id_proyecto: { table: 'proyectos', idColumn: 'Id_proyecto', labelColumn: 'Nombre_proyecto' },
  },
  factura_detalle: {
    Id_factura: { table: 'factura_encabezado', idColumn: 'Id_factura', labelColumn: 'Nro_comprobante' },
  },
};

// Tipado por tabla/columna para normalizar payloads
export const typesByTable = {
  clientes: {
    Id_cliente: 'serial', Razon_social: 'varchar', Cuit: 'varchar', Direccion: 'text', Telefono: 'varchar', Email: 'varchar', Fecha_alta: 'date', Estado: 'boolean',
  },
  empleados: {
    Id_empleados: 'serial', Nombre: 'varchar', Apellido: 'varchar', Dni: 'varchar', Puesto: 'varchar', Email: 'varchar', Telefono: 'varchar', Fecha_ingreso: 'date', Estado: 'boolean',
  },
  proyectos: {
    Id_proyecto: 'serial', Id_cliente: 'int', Nombre_proyecto: 'varchar', Descripcion: 'text', Fecha_inicio: 'date', Fecha_fin_estimada: 'date', Estado: 'varchar', Presupuesto: 'numeric', Id_coordinador: 'int',
  },
  tareas: {
    Id_tarea: 'serial', Id_proyecto: 'int', Id_empleado: 'int', Nombre_tarea: 'varchar', Detalle: 'text', Fecha_asignacion: 'date', Fecha_entrega: 'date', Estado: 'varchar', Horas_estimadas: 'numeric',
  },
  tiempo_de_desarrollo: {
    Id_tiempo: 'serial', Id_tarea: 'int', Id_empleado: 'int', Fecha_registro: 'date', Horas_trabajadas: 'numeric', Observaciones: 'text',
  },
  recursos: {
    Id_recurso: 'serial', Nombre_recurso: 'varchar', Tipo: 'varchar', Costo_mensual: 'numeric', Id_proyecto: 'int', Observaciones: 'text',
  },
  factura_encabezado: {
    Id_factura: 'serial', Tipo_comprobante: 'varchar', Punto_venta: 'varchar', Nro_comprobante: 'varchar', Fecha_emision: 'date', Id_cliente: 'int', Id_proyecto: 'int', Condicion_venta: 'varchar', Subtotal: 'numeric', Iva: 'numeric', Total: 'numeric', Estado_pago: 'varchar',
  },
  factura_detalle: {
    Id_detalle: 'serial', Id_factura: 'int', Descripcion: 'text', Cantidad: 'numeric', Precio_unitario: 'numeric', Alicuota_iva: 'numeric', Importe_neto: 'numeric', Importe_iva: 'numeric', Importe_total: 'numeric',
  },
};