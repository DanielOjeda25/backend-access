const { getSupabase } = require('../lib/supabaseClient');

async function getHoursByEmployee(req, res) {
  try {
    const idRaw = (req.query.id_empleado || '').toString().trim();
    if (!idRaw) {
      return res.status(400).json({ message: 'id_empleado es requerido' });
    }
    const id = /^\d+$/.test(idRaw) ? Number(idRaw) : idRaw;

    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ message: 'Supabase no está configurado. Define SUPABASE_URL y la clave en .env' });
    }

    // Buscar empleado
    const { data: empData, error: empErr } = await supabase
      .from('empleados')
      .select('*')
      .eq('Id_empleados', id)
      .limit(1);
    if (empErr) throw empErr;
    const empleado = Array.isArray(empData) ? empData[0] : null;
    if (!empleado) {
      return res.status(404).json({ message: 'Empleado no encontrado', id_empleado: id });
    }

    const nombreCompleto = `${empleado?.Nombre ?? ''} ${empleado?.Apellido ?? ''}`.trim();

    // Buscar tiempos del empleado
    const { data: tiempos, error: tErr } = await supabase
      .from('tiempo_de_desarrollo')
      .select('Horas_trabajadas')
      .eq('Id_empleado', id);
    if (tErr) throw tErr;

    const totalHoras = (Array.isArray(tiempos) ? tiempos : [])
      .reduce((sum, row) => sum + (Number(row?.Horas_trabajadas) || 0), 0);

    return res.json({ id_empleado: id, Empleado: nombreCompleto || `ID ${id}`, Total_Horas: totalHoras });
  } catch (err) {
    console.error('Error en getHoursByEmployee:', err);
    return res.status(500).json({ message: 'Error en petición personalizada', error: err?.message || String(err) });
  }
}

async function getClientsWithMultipleProjects(req, res) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ message: 'Supabase no está configurado. Define SUPABASE_URL y la clave en .env' });
    }

    // Obtener proyectos con cliente
    const { data: proyectos, error: pErr } = await supabase
      .from('proyectos')
      .select('Id_proyecto,Id_cliente');
    if (pErr) throw pErr;

    const counts = new Map();
    (Array.isArray(proyectos) ? proyectos : []).forEach((p) => {
      const idc = p?.Id_cliente;
      if (idc !== null && idc !== undefined) {
        counts.set(idc, (counts.get(idc) || 0) + 1);
      }
    });

    const idsFiltrados = Array.from(counts.entries())
      .filter(([, cantidad]) => Number(cantidad) > 1)
      .map(([id]) => id);

    if (idsFiltrados.length === 0) {
      return res.json([]);
    }

    // Obtener razón social de cada cliente filtrado
    const { data: clientes, error: cErr } = await supabase
      .from('clientes')
      .select('Id_cliente,Razon_social')
      .in('Id_cliente', idsFiltrados);
    if (cErr) throw cErr;

    const byId = new Map((Array.isArray(clientes) ? clientes : []).map((c) => [c.Id_cliente, c]));

    const resultado = idsFiltrados.map((idc) => ({
      id_cliente: idc,
      Nombre_Cliente: byId.get(idc)?.Razon_social || null,
      Cantidad_Proyectos: counts.get(idc) || 0,
    }));

    return res.json(resultado);
  } catch (err) {
    console.error('Error en getClientsWithMultipleProjects:', err);
    return res.status(500).json({ message: 'Error en petición personalizada (clientes con múltiples proyectos)', error: err?.message || String(err) });
  }
}

async function getInvoicesByClient(req, res) {
  try {
    const idRaw = (req.query.id_cliente || '').toString().trim();
    if (!idRaw) {
      return res.status(400).json({ message: 'id_cliente es requerido' });
    }
    const idCliente = /^\d+$/.test(idRaw) ? Number(idRaw) : idRaw;

    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ message: 'Supabase no está configurado. Define SUPABASE_URL y la clave en .env' });
    }

    // Cliente
    const { data: clienteData, error: cErr } = await supabase
      .from('clientes')
      .select('*')
      .eq('Id_cliente', idCliente)
      .limit(1);
    if (cErr) throw cErr;
    const cliente = Array.isArray(clienteData) ? clienteData[0] : null;
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado', id_cliente: idCliente });
    }

    // Facturas del cliente
    const { data: facturas, error: fErr } = await supabase
      .from('factura_encabezado')
      .select('Id_factura,Fecha_emision,Total,Id_cliente,Id_proyecto')
      .eq('Id_cliente', idCliente);
    if (fErr) throw fErr;
    const lista = Array.isArray(facturas) ? facturas : [];

    // Proyectos referenciados
    const proyectoIds = Array.from(new Set(lista.map((f) => f?.Id_proyecto).filter((v) => v != null)));
    let proyectosMap = new Map();
    if (proyectoIds.length > 0) {
      const { data: proyectos, error: pErr } = await supabase
        .from('proyectos')
        .select('Id_proyecto,Nombre_proyecto')
        .in('Id_proyecto', proyectoIds);
      if (pErr) throw pErr;
      proyectosMap = new Map((Array.isArray(proyectos) ? proyectos : []).map((p) => [p.Id_proyecto, p.Nombre_proyecto]));
    }

    const nombreCliente = cliente?.Razon_social || null;
    const resultado = lista.map((f) => ({
      Id_factura: f?.Id_factura,
      Fecha_emision: f?.Fecha_emision,
      Total: f?.Total,
      Cliente: nombreCliente,
      Nombre_proyecto: proyectosMap.get(f?.Id_proyecto) || null,
    }));

    return res.json(resultado);
  } catch (err) {
    console.error('Error en getInvoicesByClient:', err);
    return res.status(500).json({ message: 'Error en petición personalizada (facturas por cliente)', error: err?.message || String(err) });
  }
}

async function getProjectsByEstado(req, res) {
  try {
    const estadoRaw = (req.query.Estado || '').toString().trim();
    if (!estadoRaw) {
      return res.status(400).json({ message: 'Estado es requerido' });
    }
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ message: 'Supabase no está configurado. Define SUPABASE_URL y la clave en .env' });
    }

    const { data, error } = await supabase
      .from('proyectos')
      .select('Id_proyecto,Nombre_proyecto,Fecha_inicio,Estado')
      .eq('Estado', estadoRaw)
      .order('Fecha_inicio', { ascending: false });
    if (error) throw error;

    return res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('Error en getProjectsByEstado:', err);
    return res.status(500).json({ message: 'Error en petición personalizada (proyectos por estado)', error: err?.message || String(err) });
  }
}

module.exports = { getHoursByEmployee, getClientsWithMultipleProjects, getInvoicesByClient, getProjectsByEstado };