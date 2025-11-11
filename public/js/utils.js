// Utilidades comunes compartidas entre las vistas (custom, UI y CRUD)

// --- Utilidades específicas de la vista custom ---
export function parseCostoRange(val) {
  const input = (val || '').trim();
  if (!input) return null;
  let min;
  let max = null;
  if (input.endsWith('+')) {
    min = Number(input.replace('+', ''));
  } else {
    const [a, b] = input.split('-');
    min = Number(a);
    max = Number(b);
  }
  if (!Number.isFinite(min) || min < 0 || (max !== null && !Number.isFinite(max))) {
    return null;
  }
  return { min, max };
}

export function errorMessage(err) {
  return err?.message || String(err);
}

// --- Utilidades comunes usadas por UI y CRUD ---
export function isDateColumnName(column) {
  if (!column) return false;
  const c = String(column).toLowerCase();
  // Heurística: nombres que contienen "fecha" o "date"
  return /fecha|date/.test(c);
}

export function isDateString(value) {
  if (value === null || value === undefined) return false;
  const s = String(value).trim();
  if (!s) return false;
  // Formatos comunes: DD/MM/YYYY, YYYY-MM-DD y simple DDMMYYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) return true;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return true;
  if (/^\d{8}$/.test(s)) return true;
  // Intento de parseo
  const ts = Date.parse(s.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, '$3-$2-$1'));
  return !Number.isNaN(ts);
}

export function formatDisplayValue(column, value) {
  if (value === null || value === undefined) return '';
  // Booleanos comunes
  if (/^estado$/i.test(String(column))) {
    const sv = String(value).toLowerCase();
    if (sv === 'true' || sv === '1') return 'Activo';
    if (sv === 'false' || sv === '0') return 'Inactivo';
  }
  // Fechas: normaliza a DD/MM/YYYY para mostrar
  if (isDateColumnName(column) || isDateString(value)) {
    const s = String(value).trim();
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
    const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slash) return `${slash[1].padStart(2,'0')}/${slash[2].padStart(2,'0')}/${slash[3]}`;
    const plain = s.match(/^(\d{2})(\d{2})(\d{4})$/);
    if (plain) return `${plain[1]}/${plain[2]}/${plain[3]}`;
  }
  return String(value);
}

export function getVisibleColumns(kind, columnsByTable) {
  const cols = columnsByTable?.[kind];
  return Array.isArray(cols) ? cols : [];
}

export function getFilterColumns(kind, columnsByTable, allowedEnumFiltersByTable) {
  const result = new Set();
  const visible = columnsByTable?.[kind] || [];
  for (const c of visible) {
    if (isDateColumnName(c)) result.add(c);
  }
  const allowed = allowedEnumFiltersByTable?.[kind] || [];
  for (const c of allowed) result.add(c);
  return Array.from(result);
}