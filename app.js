const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const empleadoRoutes = require('./routes/empleadoRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const listRoutes = require('./routes/listRoutes');
const customRoutes = require('./routes/customRoutes');
const { getSupabase } = require('./lib/supabaseClient');

app.use(cors());
app.use(express.json());
// Logger simple para trazar rutas y detectar 404/orden de middlewares
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});
// servir archivos estáticos para la pantalla UI
app.use(express.static(path.join(__dirname, 'public')));

// API endpoints
app.use('/api/empleados', empleadoRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/list', listRoutes);
app.use('/api/custom', customRoutes);
console.log('Montado router dinámico en /api/list');

// Debug: verificar presencia de variables de entorno sin exponerlas
app.get('/api/debug/env', (req, res) => {
  const urlOk = Boolean((process.env.SUPABASE_URL || '').trim());
  const keyOk = Boolean(((process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) || '').trim());
  res.json({ url: urlOk, key: keyOk });
});

// Debug: ping a Supabase ejecutando una consulta mínima
app.get('/api/debug/ping', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ message: 'Supabase no está configurado. Define SUPABASE_URL y la clave en .env' });
    }
    const table = (req.query.table || 'empleados').trim();
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      return res.status(500).json({ message: 'Error de conexión o consulta', error: error.message, table });
    }
    res.json({ connected: true, table, sampleRows: Array.isArray(data) ? data.length : 0 });
  } catch (err) {
    res.status(500).json({ message: 'Fallo al conectar con Supabase', error: err?.message || String(err) });
  }
});

// Debug: listar rutas montadas en Express
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods)
        .filter((m) => middleware.route.methods[m])
        .map((m) => m.toUpperCase());
      routes.push({ path: middleware.route.path, methods });
    } else if (middleware.name === 'router' && middleware.handle.stack) {
      middleware.handle.stack.forEach((handler) => {
        const route = handler.route;
        if (route) {
          const methods = Object.keys(route.methods)
            .filter((m) => route.methods[m])
            .map((m) => m.toUpperCase());
          routes.push({ path: route.path, methods, mountpath: middleware.regexp?.source || '' });
        }
      });
    }
  });
  res.json({ routes });
});

// Puerto fijo sin dotenv
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
