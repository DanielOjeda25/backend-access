export function isDateString(value) {
  if (value == null) return false;
  const v = String(value);
  const isoLike = /^\d{4}-\d{2}-\d{2}/.test(v);
  const slashLike = /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v);
  if (!(isoLike || slashLike)) return false;
  const t = Date.parse(v.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, '$3-$2-$1'));
  return !Number.isNaN(t);
}

export function isDateColumnName(name) {
  return /^Fecha_/i.test(name);
}

export function getVisibleColumns(kind, columnsByTable) {
  // Mostrar todas las columnas, incluyendo IDs, manteniendo el orden definido
  const cols = columnsByTable[kind] || [];
  return cols;
}

export function getFilterColumns(kind, columnsByTable, allowedEnumFiltersByTable) {
  const visible = getVisibleColumns(kind, columnsByTable);
  const enumCols = (allowedEnumFiltersByTable[kind] || []).filter(c => visible.includes(c));
  const dateCols = visible.filter(c => isDateColumnName(c));
  const set = new Set([...enumCols, ...dateCols]);
  return Array.from(set);
}

export function formatDisplayValue(column, value) {
  if (value == null) return '';
  const v = String(value);
  // Map booleans a Activo/Inactivo
  if (v.toLowerCase() === 'true' || v === 'true' || value === true) return 'Activo';
  if (v.toLowerCase() === 'false' || v === 'false' || value === false) return 'Inactivo';
  // Fechas: mostrar como DD/MM/YYYY
  const isPotentialDate = isDateColumnName(column)
    || /^\d{4}-\d{2}-\d{2}/.test(v)
    || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v)
    || /^(\d{2})(\d{2})(\d{4})$/.test(v);
  if (isPotentialDate) {
    const isoMatch = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${d}/${m}/${y}`;
    }
    const slashMatch = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const [ , dd, mm, yyyy ] = slashMatch;
      const d = dd.padStart(2, '0');
      const m = mm.padStart(2, '0');
      return `${d}/${m}/${yyyy}`;
    }
    const plainMatch = v.match(/^(\d{2})(\d{2})(\d{4})$/);
    if (plainMatch) {
      const [ , dd, mm, yyyy ] = plainMatch;
      return `${dd}/${mm}/${yyyy}`;
    }
  }
  return v;
}