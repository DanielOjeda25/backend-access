import { state, columnsByTable, allowedEnumFiltersByTable } from './data.js';
import { isDateString, isDateColumnName, getVisibleColumns, getFilterColumns } from './utils.js';

function qs(id) { return document.getElementById(id); }

const els = {
  statusEl: null,
  theadEl: null,
  tbodyEl: null,
  searchEl: null,
  filtersPanelEl: null,
  filtersClearBtn: null,
  pageSizeEl: null,
  prevBtn: null,
  nextBtn: null,
  pageInfoEl: null,
  selectEl: null,
};

export function init() {
  els.statusEl = qs('status');
  els.theadEl = qs('thead');
  els.tbodyEl = qs('tbody');
  els.searchEl = qs('search');
  els.filtersPanelEl = qs('filters-panel');
  els.filtersClearBtn = qs('filters-clear');
  els.pageSizeEl = qs('page-size');
  els.prevBtn = qs('prev');
  els.nextBtn = qs('next');
  els.pageInfoEl = qs('page-info');
  els.selectEl = qs('tabla-select');

  bindEvents();
  // cargar la primera opción por defecto
  loadAndRender(els.selectEl.value);
}

function bindEvents() {
  els.selectEl.addEventListener('change', () => loadAndRender(els.selectEl.value));
  let searchTimer = null;
  els.searchEl.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { applyFilter(); renderPage(); }, 150);
  });
  els.filtersClearBtn.addEventListener('click', () => {
    const table = state.currentTable;
    const s = state.filtersByTable[table] || {};
    for (const [col, cfg] of Object.entries(s)) {
      if (cfg.type === 'eq') cfg.eq = '';
      if (cfg.type === 'date') { cfg.from = ''; cfg.to = ''; }
    }
    buildFiltersUI();
    applyFilter();
    renderPage();
  });
  els.pageSizeEl.addEventListener('change', () => { state.currentPage = 1; renderPage(); });
  els.prevBtn.addEventListener('click', () => { state.currentPage = Math.max(1, state.currentPage - 1); renderPage(); });
  els.nextBtn.addEventListener('click', () => { state.currentPage = state.currentPage + 1; renderPage(); });
}

async function loadAndRender(table) {
  els.statusEl.textContent = 'Cargando ' + table + '...';
  try {
    const params = new URLSearchParams();
    params.set('limit', '1000');
    const url = '/api/list/' + table + '?' + params.toString();
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    state.cacheByTable[table] = Array.isArray(data) ? data : [];
    state.currentTable = table;
    buildFiltersUI();
    applyFilter();
    renderPage();
    els.statusEl.textContent = 'Mostrando ' + table + ' (' + (state.cacheByTable[table]?.length || 0) + ' registros totales)';
  } catch (err) {
    console.error(err);
    els.statusEl.textContent = 'Error cargando ' + table + ': ' + (err?.message || err);
    renderTable(table, []);
  }
}

function buildFiltersUI() {
  els.filtersPanelEl.innerHTML = '';
  const rows = state.cacheByTable[state.currentTable] || [];
  const filterCols = getFilterColumns(state.currentTable, columnsByTable, allowedEnumFiltersByTable);
  const st = {};
  for (const col of filterCols) {
    const group = document.createElement('div');
    group.className = 'filter-group';
    const label = document.createElement('label');
    label.textContent = col + ':';

    const uniques = new Set();
    for (const r of rows) {
      const v = r?.[col];
      if (v === null || v === undefined || v === '') continue;
      uniques.add(v);
    }
    const sampleVal = rows.find(r => r?.[col] !== undefined && r?.[col] !== null)?.[col];
    const isDate = isDateColumnName(col) || isDateString(sampleVal);

    if (isDate) {
      const from = document.createElement('input');
      from.type = 'date';
      const to = document.createElement('input');
      to.type = 'date';
      from.addEventListener('change', () => { st[col].from = from.value; applyFilter(); renderPage(); });
      to.addEventListener('change', () => { st[col].to = to.value; applyFilter(); renderPage(); });
      group.appendChild(label);
      group.appendChild(from);
      group.appendChild(to);
      st[col] = { type: 'date', from: '', to: '' };
    } else {
      const select = document.createElement('select');
      const allOpt = document.createElement('option');
      allOpt.value = '';
      allOpt.textContent = 'Todos';
      select.appendChild(allOpt);
      const values = Array.from(uniques);
      values.sort((a,b) => String(a).localeCompare(String(b)));
      for (const v of values) {
        const opt = document.createElement('option');
        opt.value = String(v);
        opt.textContent = String(v);
        select.appendChild(opt);
      }
      select.addEventListener('change', () => { st[col].eq = select.value; applyFilter(); renderPage(); });
      group.appendChild(label);
      group.appendChild(select);
      st[col] = { type: 'eq', eq: '' };
    }

    els.filtersPanelEl.appendChild(group);
  }
  state.filtersByTable[state.currentTable] = st;
}

function applyFilter() {
  const normalized = (els.searchEl.value || '').replace(/\s+/g, ' ').trim();
  els.searchEl.value = normalized;
  const q = normalized.toLowerCase();
  const rows = state.cacheByTable[state.currentTable] || [];
  const s = state.filtersByTable[state.currentTable] || {};

  let filtered = rows.filter((row) => {
    for (const [col, cfg] of Object.entries(s)) {
      const val = row?.[col];
      if (cfg.type === 'eq') {
        if (cfg.eq && String(val) !== cfg.eq) return false;
      } else if (cfg.type === 'date') {
        if (cfg.from) {
          const fromTs = Date.parse(cfg.from);
          const rowTs = Date.parse(String(val).replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, '$3-$2-$1'));
          if (!Number.isNaN(fromTs) && !Number.isNaN(rowTs)) {
            if (rowTs < fromTs) return false;
          }
        }
        if (cfg.to) {
          const toTs = Date.parse(cfg.to);
          const rowTs2 = Date.parse(String(val).replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, '$3-$2-$1'));
          if (!Number.isNaN(toTs) && !Number.isNaN(rowTs2)) {
            if (rowTs2 > toTs) return false;
          }
        }
      }
    }
    return true;
  });

  if (q) {
    const sample = rows[0] || {};
    const allStringCols = Object.keys(sample).filter((k) => typeof sample[k] === 'string');
    filtered = filtered.filter((row) => allStringCols.some((c) => String(row?.[c] ?? '').toLowerCase().includes(q)));
  }

  state.currentFiltered = filtered;
  state.currentPage = 1;
  updateStatus();
}

function updateStatus() {
  const total = (state.cacheByTable[state.currentTable]?.length || 0);
  const filtered = state.currentFiltered.length;
  const extra = (els.searchEl.value || '').length ? ' | filtro: "' + els.searchEl.value + '"' : '';
  els.statusEl.textContent = 'Mostrando ' + state.currentTable + ' (filtrados: ' + filtered + ' de ' + total + ')' + extra;
}

function renderPage() {
  state.pageSize = Number((els.pageSizeEl && els.pageSizeEl.value) || 50);
  const maxPage = Math.max(1, Math.ceil((state.currentFiltered.length || 0) / state.pageSize));
  if (state.currentPage > maxPage) state.currentPage = maxPage;
  if (state.currentPage < 1) state.currentPage = 1;
  const start = (state.currentPage - 1) * state.pageSize;
  const pageRows = (state.currentFiltered || []).slice(start, start + state.pageSize);
  renderTable(state.currentTable, pageRows);
  els.pageInfoEl.textContent = 'Página ' + state.currentPage + ' / ' + maxPage;
  els.prevBtn.disabled = state.currentPage <= 1;
  els.nextBtn.disabled = state.currentPage >= maxPage;
}

function renderTable(kind, rows) {
  els.tbodyEl.innerHTML = '';
  els.theadEl.innerHTML = '';
  const columns = getVisibleColumns(kind, columnsByTable);
  const trHead = document.createElement('tr');
  for (const col of columns) {
    const th = document.createElement('th');
    th.textContent = col;
    trHead.appendChild(th);
  }
  els.theadEl.appendChild(trHead);
  for (const row of rows) {
    const tr = document.createElement('tr');
    for (const col of columns) {
      const td = document.createElement('td');
      td.textContent = row?.[col] ?? '';
      tr.appendChild(td);
    }
    els.tbodyEl.appendChild(tr);
  }
}