const { getSupabase } = require('../lib/supabaseClient');

const ALLOWED_TABLES = [
  'clientes',
  'empleados',
  'proyectos',
  'tareas',
  'tiempo_de_desarrollo',
  'recursos',
  'factura_encabezado',
  'factura_detalle',
];

// Primary keys por tabla para operaciones de actualización/eliminación
const PRIMARY_KEYS = {
  clientes: 'Id_cliente',
  empleados: 'Id_empleados',
  proyectos: 'Id_proyecto',
  tareas: 'Id_tarea',
  tiempo_de_desarrollo: 'Id_tiempo',
  recursos: 'Id_recurso',
  factura_encabezado: 'Id_factura',
  factura_detalle: 'Id_detalle',
};

// Columnas conocidas por tabla (para filtrar payloads y respetar estructura)
const COLUMNS_BY_TABLE = {
  empleados: ['Id_empleados', 'Nombre', 'Apellido', 'Dni', 'Puesto', 'Email', 'Telefono', 'Fecha_ingreso', 'Estado'],
  clientes: ['Id_cliente', 'Razon_social', 'Cuit', 'Direccion', 'Telefono', 'Email', 'Fecha_alta', 'Estado'],
  proyectos: ['Id_proyecto', 'Id_cliente', 'Nombre_proyecto', 'Descripcion', 'Fecha_inicio', 'Fecha_fin_estimada', 'Estado', 'Presupuesto', 'Id_coordinador'],
  tareas: ['Id_tarea', 'Id_proyecto', 'Id_empleado', 'Nombre_tarea', 'Detalle', 'Fecha_asignacion', 'Fecha_entrega', 'Estado', 'Horas_estimadas'],
  tiempo_de_desarrollo: ['Id_tiempo', 'Id_tarea', 'Id_empleado', 'Fecha_registro', 'Horas_trabajadas', 'Observaciones'],
  recursos: ['Id_recurso', 'Nombre_recurso', 'Tipo', 'Costo_mensual', 'Id_proyecto', 'Observaciones'],
  factura_encabezado: ['Id_factura', 'Tipo_comprobante', 'Punto_venta', 'Nro_comprobante', 'Fecha_emision', 'Id_cliente', 'Id_proyecto', 'Condicion_venta', 'Subtotal', 'Iva', 'Total', 'Estado_pago'],
  factura_detalle: ['Id_detalle', 'Id_factura', 'Descripcion', 'Cantidad', 'Precio_unitario', 'Alicuota_iva', 'Importe_neto', 'Importe_iva', 'Importe_total'],
};

// Columnas buscables por tabla (evitar columnas numéricas o fechas para ilike)
const SEARCHABLE_COLUMNS = {
  empleados: ['Nombre', 'Apellido', 'Dni', 'Puesto', 'Email', 'Telefono'],
  clientes: ['Razon_social', 'Cuit', 'Direccion', 'Telefono', 'Email'],
  proyectos: ['Nombre_proyecto', 'Descripcion', 'Estado'],
  tareas: ['Nombre_tarea', 'Detalle', 'Estado'],
  tiempo_de_desarrollo: ['Observaciones'],
  recursos: ['Nombre_recurso', 'Tipo', 'Observaciones'],
  factura_encabezado: ['Tipo_comprobante', 'Nro_comprobante', 'Condicion_venta', 'Estado_pago'],
  factura_detalle: ['Descripcion'],
};

// Filtros por campo por tabla (tipos: string | boolean | number | date)
const FILTERS_BY_TABLE = {
  clientes: {
    string: ['Razon_social', 'Cuit', 'Direccion', 'Telefono', 'Email'],
    boolean: ['Estado'],
    number: ['Id_cliente'],
    date: ['Fecha_alta'],
  },
  empleados: {
    string: ['Nombre', 'Apellido', 'Dni', 'Puesto', 'Email', 'Telefono'],
    boolean: ['Estado'],
    number: ['Id_empleados'],
    date: ['Fecha_ingreso'],
  },
  proyectos: {
    string: ['Nombre_proyecto', 'Descripcion', 'Estado'],
    boolean: [],
    number: ['Id_proyecto', 'Presupuesto', 'Id_cliente', 'Id_coordinador'],
    date: ['Fecha_inicio', 'Fecha_fin_estimada'],
  },
  tareas: {
    string: ['Nombre_tarea', 'Detalle', 'Estado'],
    boolean: [],
    number: ['Id_tarea', 'Id_proyecto', 'Id_empleado', 'Horas_estimadas'],
    date: ['Fecha_asignacion', 'Fecha_entrega'],
  },
  tiempo_de_desarrollo: {
    string: ['Observaciones'],
    boolean: [],
    number: ['Id_tiempo', 'Id_tarea', 'Id_empleado', 'Horas_trabajadas'],
    date: ['Fecha_registro'],
  },
  recursos: {
    string: ['Nombre_recurso', 'Tipo', 'Observaciones'],
    boolean: [],
    number: ['Id_recurso', 'Costo_mensual', 'Id_proyecto'],
    date: [],
  },
  factura_encabezado: {
    string: ['Tipo_comprobante', 'Punto_venta', 'Nro_comprobante', 'Condicion_venta', 'Estado_pago'],
    boolean: [],
    number: ['Id_factura', 'Id_cliente', 'Id_proyecto', 'Subtotal', 'Iva', 'Total'],
    date: ['Fecha_emision'],
  },
  factura_detalle: {
    string: ['Descripcion'],
    boolean: [],
    number: ['Id_detalle', 'Id_factura', 'Cantidad', 'Precio_unitario', 'Alicuota_iva', 'Importe_neto', 'Importe_iva', 'Importe_total'],
    date: [],
  },
};

async function listarTablaDinamica(req, res) {
  try {
    const table = (req.params.table || '').trim();
    if (!ALLOWED_TABLES.includes(table)) {
      return res.status(400).json({ message: 'Tabla no permitida', table });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({
        message: 'Supabase no está configurado. Define SUPABASE_URL y la clave en .env',
      });
    }

    const qRaw = (req.query.q || '').toString().trim();
    const limit = Math.min(parseInt(req.query.limit) || 100, 200);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);
    const orderBy = (req.query.orderBy || '').trim();
    const orderDir = ((req.query.orderDir || 'asc').trim().toLowerCase() === 'desc') ? 'desc' : 'asc';
    console.log(`[LIST] table=${table} q=${qRaw} limit=${limit} offset=${offset} orderBy=${orderBy} orderDir=${orderDir}`);

    // Caso especializado: proyectos con filtro SQL ILIKE sobre "Nombre_proyecto"
    // Si se proporciona q, consultar directamente en Supabase con ilike; de lo contrario, limitar.
    if (table === 'proyectos') {
      let query = supabase.from('proyectos').select('*').limit(limit);
      if (qRaw) {
        query = query.ilike('Nombre_proyecto', `%${qRaw}%`);
      }
      const { data: sqlData, error: sqlError } = await query;
      if (sqlError) throw sqlError;
      console.log(`[LIST] (SQL) proyectos returned=${Array.isArray(sqlData) ? sqlData.length : 0}`);
      return res.json(sqlData || []);
    }

    // Consulta base sin filtros de server para evitar problemas con columnas mayúsculas/entrecomilladas
    const { data, error } = await supabase.from(table).select('*');
    if (error) throw error;

    let result = Array.isArray(data) ? data : [];
    console.log(`[LIST] fetched=${result.length}`);

    // Filtro en servidor (Node) por columnas de texto
    if (qRaw) {
      const qLower = qRaw.toLowerCase();
      const predefined = SEARCHABLE_COLUMNS[table] || [];
      const sample = result[0] || {};
      const inferred = Object.keys(sample).filter((k) => typeof sample[k] === 'string');
      const cols = predefined.length > 0 ? predefined : inferred;
      result = result.filter((row) => {
        return cols.some((c) => String(row?.[c] ?? '').toLowerCase().includes(qLower));
      });
    }
    console.log(`[LIST] afterFilter=${result.length}`);

    // Aplicar filtros por campo según tipos
    const types = FILTERS_BY_TABLE[table] || { string: [], boolean: [], number: [], date: [] };
    // string exacto y like
    for (const col of types.string) {
      const val = req.query[col];
      const like = req.query[`${col}_like`];
      if (val != null) {
        const v = String(val).toLowerCase();
        result = result.filter((row) => String(row?.[col] ?? '').toLowerCase() === v);
      }
      if (like != null) {
        const v = String(like).toLowerCase();
        result = result.filter((row) => String(row?.[col] ?? '').toLowerCase().includes(v));
      }
    }
    // boolean
    for (const col of types.boolean) {
      if (col in req.query) {
        const raw = String(req.query[col]).toLowerCase();
        const target = raw === 'true' ? true : raw === 'false' ? false : null;
        if (target !== null) {
          result = result.filter((row) => Boolean(row?.[col]) === target);
        }
      }
    }
    // number iguales y rangos
    for (const col of types.number) {
      const eq = req.query[col];
      const min = req.query[`${col}_min`];
      const max = req.query[`${col}_max`];
      if (eq != null) {
        const num = Number(eq);
        if (!Number.isNaN(num)) {
          result = result.filter((row) => Number(row?.[col]) === num);
        }
      }
      if (min != null) {
        const num = Number(min);
        if (!Number.isNaN(num)) {
          result = result.filter((row) => Number(row?.[col]) >= num);
        }
      }
      if (max != null) {
        const num = Number(max);
        if (!Number.isNaN(num)) {
          result = result.filter((row) => Number(row?.[col]) <= num);
        }
      }
    }
    // date rangos: ISO yyyy-mm-dd
    for (const col of types.date) {
      const from = req.query[`${col}_from`];
      const to = req.query[`${col}_to`];
      if (from) {
        const t = new Date(from).getTime();
        if (!Number.isNaN(t)) {
          result = result.filter((row) => {
            const r = new Date(row?.[col]).getTime();
            return !Number.isNaN(r) && r >= t;
          });
        }
      }
      if (to) {
        const t = new Date(to).getTime();
        if (!Number.isNaN(t)) {
          result = result.filter((row) => {
            const r = new Date(row?.[col]).getTime();
            return !Number.isNaN(r) && r <= t;
          });
        }
      }
    }

    // Ordenamiento opcional
    if (orderBy && (SEARCHABLE_COLUMNS[table] || []).includes(orderBy)) {
      result.sort((a, b) => {
        const va = String(a?.[orderBy] ?? '').toLowerCase();
        const vb = String(b?.[orderBy] ?? '').toLowerCase();
        if (va < vb) return orderDir === 'desc' ? 1 : -1;
        if (va > vb) return orderDir === 'desc' ? -1 : 1;
        return 0;
      });
    }

    // Paginación
    const paged = result.slice(offset, offset + limit);
    console.log(`[LIST] returned=${paged.length}`);
    res.json(paged);
  } catch (err) {
    console.error('Error Supabase (dinámico):', err);
    res.status(500).json({ message: 'Error al consultar tabla', error: err?.message || String(err) });
  }
}

// Actualiza un registro por ID dinámicamente
async function actualizarRegistroDinamico(req, res) {
  try {
    const table = (req.params.table || '').trim();
    const id = (req.params.id || '').trim();
    if (!ALLOWED_TABLES.includes(table)) {
      return res.status(400).json({ message: 'Tabla no permitida', table });
    }
    const pk = PRIMARY_KEYS[table];
    if (!pk) {
      return res.status(400).json({ message: 'Tabla sin PK conocida', table });
    }
    if (!id) {
      return res.status(400).json({ message: 'ID requerido' });
    }
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ message: 'Supabase no está configurado. Define SUPABASE_URL y la clave en .env' });
    }
    // Filtra payload a columnas permitidas para la tabla
    const allowedCols = COLUMNS_BY_TABLE[table] || [];
    const raw = req.body || {};
    const payload = Object.keys(raw)
      .filter((k) => allowedCols.includes(k))
      .reduce((acc, k) => { acc[k] = raw[k]; return acc; }, {});
    // Convierte ID a número si aplica
    const idValue = /^\d+$/.test(id) ? Number(id) : id;
    const { data, error } = await supabase.from(table).update(payload).eq(pk, idValue).select('*');
    if (error) throw error;
    return res.json({ updated: Array.isArray(data) ? data.length : 0, data: data || [] });
  } catch (err) {
    console.error('Error al actualizar registro dinámico:', err);
    return res.status(500).json({ message: 'Error al actualizar', error: err?.message || String(err) });
  }
}

// Inserta un registro dinámicamente
async function crearRegistroDinamico(req, res) {
  try {
    const table = (req.params.table || '').trim();
    if (!ALLOWED_TABLES.includes(table)) {
      return res.status(400).json({ message: 'Tabla no permitida', table });
    }
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ message: 'Supabase no está configurado. Define SUPABASE_URL y la clave en .env' });
    }
    const allowedCols = COLUMNS_BY_TABLE[table] || [];
    const raw = req.body || {};
    const payload = Object.keys(raw)
      .filter((k) => allowedCols.includes(k))
      .reduce((acc, k) => { acc[k] = raw[k]; return acc; }, {});
    const { data, error } = await supabase.from(table).insert([payload]).select('*');
    if (error) throw error;
    return res.json({ inserted: Array.isArray(data) ? data.length : 0, data: data || [] });
  } catch (err) {
    console.error('Error al insertar registro dinámico:', err);
    return res.status(500).json({ message: 'Error al insertar', error: err?.message || String(err) });
  }
}

// Elimina un registro por ID dinámicamente
async function eliminarRegistroDinamico(req, res) {
  try {
    const table = (req.params.table || '').trim();
    const id = (req.params.id || '').trim();
    if (!ALLOWED_TABLES.includes(table)) {
      return res.status(400).json({ message: 'Tabla no permitida', table });
    }
    const pk = PRIMARY_KEYS[table];
    if (!pk) {
      return res.status(400).json({ message: 'Tabla sin PK conocida', table });
    }
    if (!id) {
      return res.status(400).json({ message: 'ID requerido' });
    }
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ message: 'Supabase no está configurado. Define SUPABASE_URL y la clave en .env' });
    }
    const idValue = /^\d+$/.test(id) ? Number(id) : id;
    const { data, error } = await supabase.from(table).delete().eq(pk, idValue).select('*');
    if (error) throw error;
    return res.json({ deleted: Array.isArray(data) ? data.length : 0, data: data || [] });
  } catch (err) {
    console.error('Error al eliminar registro dinámico:', err);
    return res.status(500).json({ message: 'Error al eliminar', error: err?.message || String(err) });
  }
}

module.exports = { listarTablaDinamica, ALLOWED_TABLES, actualizarRegistroDinamico, crearRegistroDinamico, eliminarRegistroDinamico };