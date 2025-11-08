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