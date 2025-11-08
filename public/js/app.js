import { createView } from './multi.js';
import { combineRows, joinByKeys } from './combiner.js';

function fillSelect(selectEl, options) {
  selectEl.innerHTML = '';
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = '(sin clave)';
  selectEl.appendChild(empty);
  for (const o of options) {
    const opt = document.createElement('option');
    opt.value = o;
    opt.textContent = o;
    selectEl.appendChild(opt);
  }
}

function renderCombined(columns, rows) {
  const thead = document.getElementById('thead-combined');
  const tbody = document.getElementById('tbody-combined');
  thead.innerHTML = '';
  tbody.innerHTML = '';
  const trh = document.createElement('tr');
  for (const c of columns) {
    const th = document.createElement('th');
    th.textContent = c;
    trh.appendChild(th);
  }
  thead.appendChild(trh);
  for (const r of rows) {
    const tr = document.createElement('tr');
    for (const c of columns) {
      const td = document.createElement('td');
      td.textContent = r?.[c] ?? '';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

function renderCombinedBodyOnly(columns, rows) {
  const tbody = document.getElementById('tbody-combined');
  tbody.innerHTML = '';
  for (const r of rows) {
    const tr = document.createElement('tr');
    for (const c of columns) {
      const td = document.createElement('td');
      td.textContent = r?.[c] ?? '';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

let colsLeft = [];
let colsRight = [];

const leftView = createView({
  status: 'status-l',
  thead: 'thead-l',
  tbody: 'tbody-l',
  search: 'search-l',
  filtersPanel: 'filters-panel-l',
  filtersClearBtn: 'filters-clear-l',
  pageSize: 'page-size-l',
  prevBtn: 'prev-l',
  nextBtn: 'next-l',
  pageInfo: 'page-info-l',
  select: 'tabla-select-l',
}, {
  onAfterLoad(cols) {
    colsLeft = cols;
    const sel = document.getElementById('join-left-key');
    fillSelect(sel, colsLeft);
  }
});

const rightView = createView({
  status: 'status-r',
  thead: 'thead-r',
  tbody: 'tbody-r',
  search: 'search-r',
  filtersPanel: 'filters-panel-r',
  filtersClearBtn: 'filters-clear-r',
  pageSize: 'page-size-r',
  prevBtn: 'prev-r',
  nextBtn: 'next-r',
  pageInfo: 'page-info-r',
  select: 'tabla-select-r',
}, {
  onAfterLoad(cols) {
    colsRight = cols;
    const sel = document.getElementById('join-right-key');
    fillSelect(sel, colsRight);
  }
});

leftView.init();
rightView.init();

// Estado del combinado para búsqueda/exportación/gráfico
let combinedColumns = [];
let combinedRows = [];
let filteredCombinedRows = [];
let chartInstance = null;
let chartInstances = [];

// Elementos de UI adicionales del combinado
const combinedSearch = document.getElementById('search-combined');
const exportCombinedBtn = document.getElementById('export-combined');
const chartColumnSelect = document.getElementById('chart-column');
const showChartBtn = document.getElementById('show-chart');
const chartOverlay = document.getElementById('chart-overlay');
const closeChartBtn = document.getElementById('close-chart');
const chartCanvas = document.getElementById('combined-chart');
const showSummaryBtn = document.getElementById('show-summary');
const chartsGrid = document.getElementById('charts-grid');
const chartGroupSelect = document.getElementById('chart-group');

document.getElementById('gen-combined').addEventListener('click', () => {
  const keyA = document.getElementById('join-left-key').value;
  const keyB = document.getElementById('join-right-key').value;
  const rowsA = leftView.getFilteredRows();
  const rowsB = rightView.getFilteredRows();
  const colsA = leftView.getVisibleColumns();
  const colsB = rightView.getVisibleColumns();
  let result;
  if (keyA && keyB) {
    result = joinByKeys(rowsA, colsA, rowsB, colsB, keyA, keyB);
  } else {
    result = combineRows(rowsA, colsA, rowsB, colsB, 'union');
  }
  renderCombined(result.columns, result.rows);
  combinedColumns = result.columns;
  combinedRows = result.rows;
  filteredCombinedRows = combinedRows;
  updateChartColumns(combinedColumns);
});

function updateChartColumns(cols) {
  if (!chartColumnSelect) return;
  chartColumnSelect.innerHTML = '';
  for (const c of cols) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    chartColumnSelect.appendChild(opt);
  }
  if (chartGroupSelect) {
    chartGroupSelect.innerHTML = '';
    for (const c of cols) {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      chartGroupSelect.appendChild(opt);
    }
  }
}

combinedSearch?.addEventListener('input', () => {
  const q = (combinedSearch.value || '').toLowerCase();
  if (!q) {
    filteredCombinedRows = combinedRows;
  } else {
    filteredCombinedRows = combinedRows.filter(row => {
      for (const col of combinedColumns) {
        const v = row[col];
        if (v != null && String(v).toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }
  renderCombinedBodyOnly(combinedColumns, filteredCombinedRows);
});

exportCombinedBtn?.addEventListener('click', () => {
  if (!combinedRows?.length) return;
  const rows = filteredCombinedRows?.length ? filteredCombinedRows : combinedRows;
  const csv = toCSV(combinedColumns, rows);
  const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tabla_combinada.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

function toCSV(cols, rows) {
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const header = cols.join(',');
  const lines = rows.map(r => cols.map(c => escape(r[c])).join(','));
  return [header, ...lines].join('\n');
}

showChartBtn?.addEventListener('click', () => {
  if (!combinedRows?.length) return;
  chartOverlay.classList.remove('hidden');
  chartsGrid?.classList.add('hidden');
  chartCanvas?.classList.remove('hidden');
  if (chartGroupSelect && chartColumnSelect) {
    chartGroupSelect.value = chartColumnSelect.value || combinedColumns[0];
  }
  renderChart(chartColumnSelect?.value || combinedColumns[0]);
});

closeChartBtn?.addEventListener('click', () => {
  chartOverlay.classList.add('hidden');
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  chartsGrid && (chartsGrid.innerHTML = '');
  chartInstances.forEach(c => { try { c.destroy(); } catch (e) {} });
  chartInstances = [];
});

chartColumnSelect?.addEventListener('change', () => {
  if (!chartOverlay.classList.contains('hidden')) {
    if (chartGroupSelect) chartGroupSelect.value = chartColumnSelect.value;
    renderChart(chartColumnSelect.value);
  }
});

chartGroupSelect?.addEventListener('change', () => {
  if (chartColumnSelect) chartColumnSelect.value = chartGroupSelect.value;
  renderChart(chartGroupSelect.value);
});

function renderChart(column) {
  const rows = filteredCombinedRows?.length ? filteredCombinedRows : combinedRows;
  const { labels, data } = aggregateForPie(column, rows, 8);
  const colors = getPalette(labels.length);
  const ctx = chartCanvas.getContext('2d');
  if (chartInstance) chartInstance.destroy();
  chartInstance = new window.Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        label: `Distribución por ${column}`,
        data,
        backgroundColor: colors,
        borderColor: '#fff',
        borderWidth: 1,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right' },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const value = ctx.parsed;
              const pct = total ? ((value / total) * 100).toFixed(1) : '0.0';
              const label = ctx.label || '';
              return `${label}: ${value} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

// Resumen: múltiples gráficos por columna
showSummaryBtn?.addEventListener('click', () => {
  if (!combinedRows?.length) return;
  chartOverlay.classList.remove('hidden');
  chartCanvas?.classList.add('hidden');
  chartsGrid?.classList.remove('hidden');
  renderSummaryCharts();
});

function renderSummaryCharts() {
  if (!chartsGrid) return;
  chartsGrid.innerHTML = '';
  chartInstances.forEach(c => { try { c.destroy(); } catch (e) {} });
  chartInstances = [];
  const rows = filteredCombinedRows?.length ? filteredCombinedRows : combinedRows;
  const maxCharts = Math.min(combinedColumns.length, 12);
  for (let i = 0; i < maxCharts; i++) {
    const col = combinedColumns[i];
    const box = document.createElement('div');
    box.className = 'chart-box';
    const title = document.createElement('div');
    title.className = 'chart-title';
    title.textContent = col;
    const canvas = document.createElement('canvas');
    canvas.width = 360; canvas.height = 220;
    box.appendChild(title);
    box.appendChild(canvas);
    chartsGrid.appendChild(box);

    const ctx = canvas.getContext('2d');
    if (isNumericColumn(col, rows)) {
      const hist = histogramForColumn(col, rows, 10);
      const chart = new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: hist.labels,
          datasets: [{ label: 'Distribución', data: hist.counts, backgroundColor: '#4e79a7' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
      chartInstances.push(chart);
    } else {
      const { labels, data } = aggregateForPie(col, rows, 6);
      const colors = getPalette(labels.length);
      const chart = new window.Chart(ctx, {
        type: 'pie',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: '#fff', borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      });
      chartInstances.push(chart);
    }
  }
}

function isNumericColumn(column, rows) {
  let total = 0, numeric = 0;
  for (const r of rows) {
    const v = r[column];
    if (v == null || v === '') continue;
    total++;
    const n = Number(v);
    if (Number.isFinite(n)) numeric++;
  }
  return total > 0 && numeric / total >= 0.7;
}

function histogramForColumn(column, rows, bins = 10) {
  const values = [];
  for (const r of rows) {
    const n = Number(r[column]);
    if (Number.isFinite(n)) values.push(n);
  }
  if (!values.length) return { labels: [], counts: [] };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = span / bins;
  const edges = Array.from({ length: bins + 1 }, (_, i) => min + i * step);
  const counts = Array(bins).fill(0);
  for (const v of values) {
    const idx = Math.min(Math.floor((v - min) / step), bins - 1);
    counts[idx]++;
  }
  const labels = counts.map((_, i) => `${edges[i].toFixed(1)}–${edges[i + 1].toFixed(1)}`);
  return { labels, counts };
}

function aggregateForPie(column, rows, topN = 8) {
  const counts = new Map();
  for (const r of rows) {
    const key = r[column] == null ? '(vacío)' : String(r[column]);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, topN);
  const rest = sorted.slice(topN);
  const otherTotal = rest.reduce((sum, [, v]) => sum + v, 0);
  const labels = top.map(([k]) => k);
  const data = top.map(([, v]) => v);
  if (otherTotal > 0) {
    labels.push('Otros');
    data.push(otherTotal);
  }
  return { labels, data };
}

function getPalette(n) {
  const base = [
    '#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc949',
    '#af7aa1','#ff9da7','#9c755f','#bab0ab','#1f77b4','#2ca02c'
  ];
  const colors = [];
  for (let i = 0; i < n; i++) colors.push(base[i % base.length]);
  return colors;
}