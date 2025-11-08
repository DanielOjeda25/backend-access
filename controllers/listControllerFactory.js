const { getSupabase } = require('../lib/supabaseClient');

function createListHandler(table, columns) {
  return async function handler(req, res) {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        return res.status(500).json({
          message: 'Supabase no está configurado. Define SUPABASE_URL y la clave en .env',
        });
      }

      // Selecciona todas las columnas para evitar problemas con nombres "Quoted" y mayúsculas
      const { data, error } = await supabase
        .from(table)
        .select('*');

      if (error) throw error;
      res.json(data || []);
    } catch (err) {
      console.error(`Error Supabase al consultar ${table}:`, err);
      res.status(500).json({ message: `Error al consultar ${table}`, error: err?.message || String(err) });
    }
  };
}

module.exports = { createListHandler };