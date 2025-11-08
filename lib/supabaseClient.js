const { createClient } = require('@supabase/supabase-js');

let client = null;

// Configuración directa (sin dotenv)
const DIRECT_URL = 'https://ufxllbdmjfhugssuvlbs.supabase.co';
const DIRECT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmeGxsYmRtamZodWdzc3V2bGJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU0NjAzMywiZXhwIjoyMDc4MTIyMDMzfQ.1nbw1ism2JgYTvjD78zRkb6Fib00cCaNye9jl6aPnl8';

function getSupabase() {
  const url = DIRECT_URL;
  const key = DIRECT_KEY;

  if (!url || !key) {
    console.warn('Supabase: configuración directa no válida (URL/KEY vacíos)');
    return null;
  }

  if (!client) {
    client = createClient(url, key);
    console.log('Supabase: cliente inicializado (configuración directa)');
  }
  return client;
}

module.exports = { getSupabase };