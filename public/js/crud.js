import { columnsByTable, foreignKeysByTable, typesByTable } from './data.js';
import { formatDisplayValue, isDateColumnName } from './utils.js';

const tableSelect = document.getElementById('crud-table');
const statusEl = document.getElementById('crud-status');
const theadEl = document.getElementById('crud-thead');
const tbodyEl = document.getElementById('crud-tbody');
const insertBtn = document.getElementById('crud-insert');
const searchEl = document.getElementById('crud-search');
const modalEl = document.getElementById('crud-modal');
const modalCloseBtn = document.getElementById('crud-modal-close');
const modalCancelBtn = document.getElementById('crud-modal-cancel');
const modalSaveBtn = document.getElementById('crud-modal-save');
const formEl = document.getElementById('crud-form');

// PK conocidas por tabla para obtener el ID correcto al editar
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

function coerceValue(column, value) {
  // Manejo de booleanos comunes
  if (column === 'Estado') {
    const s = String(value).toLowerCase();
    if (s === 'activo' || s === 'true' || s === '1' || s === 'si' || s === 'sí') return true;
    if (s === 'inactivo' || s === 'false' || s === '0' || s === 'no') return false;
  }
  // Números: detecta por nombre de columna
  const numericCols = [/^Id_/, /^Horas_/, /^Cantidad$/, /^Punto_venta$/, /^Nro_comprobante$/, /^Presupuesto$/, /^Subtotal$/, /^Iva$/, /^Total$/, /^Costo_mensual$/, /^Precio_unitario$/, /^Alicuota_iva$/, /^Importe_(neto|iva|total)$/];
  if (numericCols.some(rx => rx.test(column))) {
    const n = Number(String(value).replace(/[,\s]/g, ''));
    if (!Number.isNaN(n)) return n;
  }
  return value;
}

// Coerción basada en tipado declarado en data.js (más robusta)
function normalizeNumericString(str) {
  const s = String(str).trim();
  if (s === '') return s;
  // Quita espacios y separadores de miles, usa punto como decimal
  const cleaned = s.replace(/[\s]/g, '').replace(/\./g, '').replace(/,/g, '.');
  return cleaned;
}

function coerceValueByType(table, column, value) {
  const type = typesByTable?.[table]?.[column];
  if (!type) return value;
  const v = value;
  switch (type) {
    case 'boolean': {
      const s = String(v).toLowerCase().trim();
      if (['true', '1', 'si', 'sí', 'activo'].includes(s)) return true;
      if (['false', '0', 'no', 'inactivo'].includes(s)) return false;
      return v;
    }
    case 'int':
    case 'serial': {
      const n = Number(normalizeNumericString(v));
      return Number.isFinite(n) ? Math.trunc(n) : v;
    }
    case 'numeric': {
      const n = Number(normalizeNumericString(v));
      return Number.isFinite(n) ? n : v;
    }
    case 'date': {
      if (!v) return v;
      const plain = String(v).match(/^(\d{2})(\d{2})(\d{4})$/);
      if (plain) return `${plain[3]}-${plain[2]}-${plain[1]}`;
      const slash = String(v).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (slash) return `${slash[3]}-${slash[2].padStart(2,'0')}-${slash[1].padStart(2,'0')}`;
      const iso = String(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (iso) return v;
      return v;
    }
    default:
      return v;
  }
}

// Cache para opciones de claves foráneas
const fkCache = {};

function getFKMeta(table, column) {
  const meta = foreignKeysByTable[table] || {};
  return meta[column] || null;
}

async function ensureFKOptions(meta) {
  const table = meta.table;
  if (fkCache[table]) return fkCache[table];
  const url = new URL(window.location.origin + '/api/list/' + table);
  url.searchParams.set('limit', '1000');
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const rows = await res.json();
  const idCol = meta.idColumn;
  const options = rows.map(r => {
    let label = '';
    if (meta.labelColumns && Array.isArray(meta.labelColumns)) {
      label = meta.labelColumns.map(c => r?.[c] ?? '').filter(Boolean).join(' ');
    } else if (meta.labelColumn) {
      label = r?.[meta.labelColumn] ?? '';
    } else {
      label = String(r?.[idCol] ?? '');
    }
    return { value: r?.[idCol], label };
  });
  fkCache[table] = options;
  return options;
}

// Almacenamiento local simple para CRUD (persistente entre recargas)
function getStoreKey(table) { return 'crud:' + table; }
function getStore(table) {
  const raw = localStorage.getItem(getStoreKey(table));
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function setStore(table, rows) {
  localStorage.setItem(getStoreKey(table), JSON.stringify(rows || []));
}

async function fetchRows(table, q = '') {
  statusEl.textContent = 'Cargando ' + table + '...';
  // Intenta pedir al backend dinámico
  try {
    const url = new URL(window.location.origin + '/api/list/' + table);
    const qq = (q || '').trim();
    if (qq) url.searchParams.set('q', qq);
    url.searchParams.set('limit', '200');
    const res = await fetch(url.toString());
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
    console.warn('Fallo GET a backend, usando localStorage. HTTP', res.status);
  } catch (err) {
    console.warn('No se pudo consultar backend, usando localStorage:', err);
  }
  // Fallback: usa almacenamiento local
  const rows = getStore(table);
  return Array.isArray(rows) ? rows : [];
}

function renderTable(table, rows) {
  const columns = columnsByTable[table] || Object.keys(rows[0] || {});
  theadEl.innerHTML = '';
  tbodyEl.innerHTML = '';
  const trh = document.createElement('tr');
  trh.className = 'bg-gray-100 dark:bg-gray-800';
  for (const c of columns) {
    const th = document.createElement('th');
    th.className = 'px-3 py-2 text-left text-gray-900 dark:text-gray-100 font-medium';
    th.textContent = c;
    trh.appendChild(th);
  }
  const thActions = document.createElement('th');
  thActions.className = 'px-3 py-2 text-left text-gray-900 dark:text-gray-100 font-medium';
  thActions.textContent = 'Acciones';
  trh.appendChild(thActions);
  theadEl.appendChild(trh);

  for (const row of rows) {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-gray-200 dark:border-gray-700 odd:bg-gray-900 even:bg-gray-800 hover:bg-gray-700/60';
    for (const c of columns) {
      const td = document.createElement('td');
      td.className = 'px-3 py-2 text-gray-100';
      td.textContent = formatDisplayValue(c, row?.[c]);
      tr.appendChild(td);
    }
    const tdAct = document.createElement('td');
    tdAct.className = 'px-3 py-2';
    const editBtn = document.createElement('button');
    editBtn.innerHTML = '<i data-lucide="pencil" class="w-4 h-4"></i><span class="hidden md:inline">Editar</span>';
    editBtn.className = 'inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded px-2 md:px-3 py-1 text-xs md:text-sm mr-2 shadow-sm';
    editBtn.addEventListener('click', () => editRow(table, columns, row));
    const delBtn = document.createElement('button');
    delBtn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i><span class="hidden md:inline">Eliminar</span>';
    delBtn.className = 'inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded px-2 md:px-3 py-1 text-xs md:text-sm shadow-sm';
    delBtn.addEventListener('click', () => deleteRow(table, columns, row));
    tdAct.appendChild(editBtn);
    tdAct.appendChild(delBtn);
    tr.appendChild(tdAct);
    tbodyEl.appendChild(tr);
  }
  // Renderizar iconos
  try { window.lucide && window.lucide.createIcons(); } catch {}
}

function promptValues(columns, row = {}) {
  const values = {};
  for (const c of columns) {
    const curr = row?.[c] ?? '';
    const v = window.prompt('Valor para ' + c, String(curr));
    if (v === null) return null; // cancel
    values[c] = v;
  }
  return values;
}

async function editRow(table, columns, row) {
  openEditModal(table, columns, row);
}

async function deleteRow(table, columns, row) {
  if (!window.confirm('¿Eliminar registro?')) return;
  const idCol = PRIMARY_KEYS[table] || columns[0];
  const idVal = row?.[idCol];
  try {
    const res = await fetch(`/api/list/${table}/${encodeURIComponent(idVal)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    await load(table);
  } catch (err) {
    alert('Error al eliminar: ' + (err?.message || err));
  }
}

async function insertRow(table, columns) {
  // Se realiza mediante modal dinámico
  openInsertModal(table, columns);
}

async function load(table) {
  try {
    const rows = await fetchRows(table, searchQuery);
    allRows = rows;
    statusEl.textContent = 'Mostrando ' + table + ' (' + rows.length + ' registros)';
    renderTable(table, rows);
  } catch (e) {
    statusEl.textContent = 'Error cargando ' + table + ': ' + (e?.message || e);
    theadEl.innerHTML = '';
    tbodyEl.innerHTML = '';
  }
}

tableSelect.addEventListener('change', () => load(tableSelect.value));
insertBtn.addEventListener('click', () => {
  const table = tableSelect.value;
  const columns = columnsByTable[table] || [];
  insertRow(table, columns);
});

searchEl.addEventListener('input', (e) => {
  searchQuery = (e.target.value || '').trim();
  // Vuelve a pedir al backend usando q (o local fallback)
  load(tableSelect.value);
});

function applySearch(rows, q) {
  // Se mantiene para fallback local cuando el backend no está disponible
  const qq = (q || '').trim();
  if (!qq) return rows;
  const needle = qq.toLowerCase();
  return rows.filter(r => JSON.stringify(r).toLowerCase().includes(needle));
}

// -------- Modal de inserción --------
let allRows = [];
let searchQuery = '';

function openInsertModal(table, columns) {
  formEl.innerHTML = '';
  const pk = PRIMARY_KEYS[table] || columns[0];
  for (const c of columns) {
    if (c === pk) continue; // No pedir PK en inserción
    const field = document.createElement('div');
    field.className = 'flex flex-col gap-1';
    const label = document.createElement('label');
    label.className = 'text-sm text-gray-300';
    label.textContent = c;
    const fkMeta = getFKMeta(table, c);
    if (fkMeta) {
      const select = document.createElement('select');
      select.name = c;
      select.className = 'border border-gray-700 bg-gray-900 text-gray-100 rounded px-3 py-2';
      const opt0 = document.createElement('option');
      opt0.value = '';
      opt0.textContent = 'Seleccione...';
      select.appendChild(opt0);
      ensureFKOptions(fkMeta).then(options => {
        options.forEach(o => {
          const opt = document.createElement('option');
          opt.value = o.value;
          opt.textContent = String(o.label || o.value);
          select.appendChild(opt);
        });
      }).catch(err => console.error('FK options error', err));
      field.appendChild(label);
      field.appendChild(select);
    } else {
      const type = typesByTable?.[table]?.[c];
      if (type === 'boolean') {
        const input = document.createElement('input');
        input.name = c;
        input.type = 'checkbox';
        input.className = 'h-4 w-4 accent-blue-600';
        field.appendChild(label);
        field.appendChild(input);
      } else if (type === 'date') {
        const input = document.createElement('input');
        input.name = c;
        input.type = 'date';
        input.className = 'border border-gray-700 bg-gray-900 text-gray-100 rounded px-3 py-2';
        field.appendChild(label);
        field.appendChild(input);
      } else {
        const input = document.createElement('input');
        input.name = c;
        input.className = 'border border-gray-700 bg-gray-900 text-gray-100 rounded px-3 py-2';
        input.type = 'text';
        field.appendChild(label);
        field.appendChild(input);
      }
    }
    formEl.appendChild(field);
  }
  modalEl.classList.remove('hidden');
  modalEl.classList.add('flex');

  // Configurar acción de guardar para inserción (POST)
  modalSaveBtn.onclick = async (e) => {
    e.preventDefault();
    const vals = {};
    for (const c of columns) {
      if (c === pk) continue; // Omitir PK del payload
      const el = formEl.querySelector(`[name="${c}"]`);
      const type = typesByTable?.[table]?.[c];
      let v = el ? el.value : '';
      if (type === 'boolean') {
        v = el ? !!el.checked : false;
      }
      if ((isDateColumnName(c) || type === 'date') && v) {
        // Convertir formatos comunes a ISO YYYY-MM-DD
        const plain = v.match(/^(\d{2})(\d{2})(\d{4})$/);
        if (plain) v = `${plain[3]}-${plain[2]}-${plain[1]}`;
        const slash = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (slash) v = `${slash[3]}-${slash[2].padStart(2,'0')}-${slash[1].padStart(2,'0')}`;
      }
      vals[c] = coerceValueByType(table, c, v);
    }
    try {
      const res = await fetch(`/api/list/${table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vals),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      closeModal();
      await load(table);
    } catch (err) {
      alert('Error al insertar: ' + (err?.message || err));
    }
  };
}

function closeModal() {
  modalEl.classList.add('hidden');
  modalEl.classList.remove('flex');
}

modalCloseBtn.addEventListener('click', closeModal);
modalCancelBtn.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });
// La acción de guardar se asigna dinámicamente por modal (insertar/editar)

// init segura
try {
  if (!tableSelect || !statusEl || !theadEl || !tbodyEl) {
    console.error('CRUD: elementos del DOM no encontrados');
  } else {
    load(tableSelect.value);
  }
} catch (err) {
  console.error('CRUD init error:', err);
  if (statusEl) statusEl.textContent = 'Error inicializando CRUD: ' + (err?.message || err);
}
function openEditModal(table, columns, row) {
  formEl.innerHTML = '';
  const pk = PRIMARY_KEYS[table] || columns[0];
  for (const c of columns) {
    const field = document.createElement('div');
    field.className = 'flex flex-col gap-1';
    const label = document.createElement('label');
    label.className = 'text-sm text-gray-300';
    label.textContent = c;
    const fkMeta = getFKMeta(table, c);
    if (fkMeta) {
      const select = document.createElement('select');
      select.name = c;
      select.className = 'border border-gray-700 bg-gray-900 text-gray-100 rounded px-3 py-2';
      const opt0 = document.createElement('option');
      opt0.value = '';
      opt0.textContent = 'Seleccione...';
      select.appendChild(opt0);
      ensureFKOptions(fkMeta).then(options => {
        options.forEach(o => {
          const opt = document.createElement('option');
          opt.value = o.value;
          opt.textContent = String(o.label || o.value);
          select.appendChild(opt);
        });
        select.value = row?.[c] ?? '';
      }).catch(err => console.error('FK options error', err));
      field.appendChild(label);
      field.appendChild(select);
    } else {
      const type = typesByTable?.[table]?.[c];
      if (type === 'boolean') {
        const input = document.createElement('input');
        input.name = c;
        input.type = 'checkbox';
        input.className = 'h-4 w-4 accent-blue-600';
        const current = row?.[c];
        const s = String(current).toLowerCase();
        input.checked = current === true || ['true','1','si','sí','activo'].includes(s);
        field.appendChild(label);
        field.appendChild(input);
      } else if (type === 'date') {
        const input = document.createElement('input');
        input.name = c;
        input.type = 'date';
        input.className = 'border border-gray-700 bg-gray-900 text-gray-100 rounded px-3 py-2';
        // Convertir valor actual a YYYY-MM-DD si viene con tiempo o en otro formato
        let current = row?.[c] ?? '';
        if (current) {
          const plain = String(current).match(/^(\d{2})(\d{2})(\d{4})$/);
          if (plain) current = `${plain[3]}-${plain[2]}-${plain[1]}`;
          const slash = String(current).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
          if (slash) current = `${slash[3]}-${slash[2].padStart(2,'0')}-${slash[1].padStart(2,'0')}`;
          const ymd = String(current).match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (ymd) current = `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
        }
        input.value = current;
        // PK en edición: readonly
        if (c === pk) {
          input.readOnly = true;
          input.className += ' opacity-60 cursor-not-allowed';
        }
        field.appendChild(label);
        field.appendChild(input);
      } else {
        const input = document.createElement('input');
        input.name = c;
        input.className = 'border border-gray-700 bg-gray-900 text-gray-100 rounded px-3 py-2';
        input.type = 'text';
        input.value = row?.[c] ?? '';
        // PK en edición: readonly
        if (c === pk) {
          input.readOnly = true;
          input.className += ' opacity-60 cursor-not-allowed';
        }
        field.appendChild(label);
        field.appendChild(input);
      }
    }
    formEl.appendChild(field);
  }
  modalEl.classList.remove('hidden');
  modalEl.classList.add('flex');

  // Reconfigurar acción de guardar para edición
  modalSaveBtn.onclick = async (e) => {
    e.preventDefault();
    const vals = {};
    for (const c of columns) {
      const el = formEl.querySelector(`[name="${c}"]`);
      const type = typesByTable?.[table]?.[c];
      let v = el ? el.value : '';
      if (type === 'boolean') {
        v = el ? !!el.checked : false;
      }
      // Normaliza fechas para backend: DDMMYYYY -> YYYY-MM-DD
      if ((isDateColumnName(c) || type === 'date') && v) {
        const plain = v.match(/^(\d{2})(\d{2})(\d{4})$/);
        if (plain) v = `${plain[3]}-${plain[2]}-${plain[1]}`;
        const slash = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (slash) v = `${slash[3]}-${slash[2].padStart(2,'0')}-${slash[1].padStart(2,'0')}`;
      }
      vals[c] = coerceValueByType(table, c, v);
    }
    const idCol = pk;
    const idVal = row?.[idCol];
    try {
      const res = await fetch(`/api/list/${table}/${encodeURIComponent(idVal)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vals),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      closeModal();
      await load(table);
    } catch (err) {
      alert('Error al actualizar: ' + (err?.message || err));
    }
  };
}