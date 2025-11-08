import { formatDisplayValue } from './utils.js';

function getPayload() {
  try {
    const raw = localStorage.getItem('combinedPayload');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('No se pudo leer combinedPayload', e);
    return null;
  }
}

function fillSelect(selectEl, options) {
  if (!selectEl) return;
  selectEl.innerHTML = '';
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
      td.textContent = formatDisplayValue(c, r?.[c]);
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
      td.textContent = formatDisplayValue(c, r?.[c]);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

function exportXLSX(columns, rows, filename) {
  if (!window.XLSX) {
    alert('La librería XLSX no está disponible.');
    return;
  }
  const aoa = [columns];
  for (const r of rows) aoa.push(columns.map(c => r?.[c] ?? ''));
  const ws = window.XLSX.utils.aoa_to_sheet(aoa);
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, 'Datos');
  window.XLSX.writeFile(wb, filename || 'tabla.xlsx');
}

function getTodayStamp() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function sanitizeName(name) {
  return String(name || 'sin_nombre')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-]/g, '');
}

let combinedColumns = [];
let combinedRows = [];
let filteredCombinedRows = [];
let chartInstance = null;
let displayLimit = 20; // filas visibles inicialmente
let displayColumns = []; // columnas visibles sin todas vacías en el subconjunto actual

function getCurrentRows() {
  const base = (filteredCombinedRows && filteredCombinedRows.length)
    ? filteredCombinedRows
    : combinedRows;
  if (!Number.isFinite(displayLimit)) return base || [];
  return (base || []).slice(0, displayLimit);
}

// Devuelve las columnas que tienen al menos algún valor no vacío en las filas visibles
function getNonEmptyColumns(columns, rows) {
  if (!Array.isArray(columns) || !Array.isArray(rows)) return columns || [];
  const result = [];
  for (const c of columns) {
    let hasValue = false;
    for (const r of rows) {
      const v = r?.[c];
      if (v !== null && v !== undefined && String(v).trim() !== '') { hasValue = true; break; }
    }
    if (hasValue) result.push(c);
  }
  // Si todas quedan vacías por algún motivo, mostrar las originales para no romper la UI
  return result.length ? result : columns;
}

function init() {
  const payload = getPayload();
  const meta = document.getElementById('meta');
  if (!payload) {
    meta.textContent = 'No se encontró el combinado. Vuelve a generarlo en la página principal.';
    return;
  }
  const { columns, rows, tableL, tableR } = payload;
  combinedColumns = columns;
  combinedRows = rows;
  filteredCombinedRows = combinedRows;
  meta.textContent = `Origen: ${tableL} + ${tableR} — Filas: ${rows.length}`;
  displayColumns = getNonEmptyColumns(combinedColumns, getCurrentRows());
  renderCombined(displayColumns, getCurrentRows());
  fillSelect(document.getElementById('chart-column'), displayColumns);
  const groupSel = document.getElementById('chart-group');
  fillSelect(groupSel, displayColumns);
  const searchEl = document.getElementById('search-combined');
  const exportBtn = document.getElementById('export-combined');
  const showChartBtn = document.getElementById('show-chart');
  const closeChartBtn = document.getElementById('close-chart');
  const chartColumnSelect = document.getElementById('chart-column');
  const chartOverlay = document.getElementById('chart-overlay');
  const chartCanvas = document.getElementById('combined-chart');
  const chartGroupSelect = document.getElementById('chart-group');
  const rowsLimitSelect = document.getElementById('rows-limit');

  searchEl?.addEventListener('input', () => {
    const q = (searchEl.value || '').toLowerCase();
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
    displayColumns = getNonEmptyColumns(combinedColumns, getCurrentRows());
    renderCombined(displayColumns, getCurrentRows());
    // actualizar selects del chart
    chartColumnSelect && fillSelect(chartColumnSelect, displayColumns);
    chartGroupSelect && fillSelect(chartGroupSelect, displayColumns);
  });

  rowsLimitSelect?.addEventListener('change', () => {
    const val = rowsLimitSelect.value;
    displayLimit = (val === 'all') ? Infinity : (parseInt(val, 10) || 20);
    displayColumns = getNonEmptyColumns(combinedColumns, getCurrentRows());
    renderCombined(displayColumns, getCurrentRows());
    chartColumnSelect && fillSelect(chartColumnSelect, displayColumns);
    chartGroupSelect && fillSelect(chartGroupSelect, displayColumns);
  });

  exportBtn?.addEventListener('click', () => {
    const rows = filteredCombinedRows?.length ? filteredCombinedRows : combinedRows;
    const cols = displayColumns?.length ? displayColumns : combinedColumns;
    const leftSafe = sanitizeName(tableL || 'izquierda');
    const rightSafe = sanitizeName(tableR || 'derecha');
    const filename = `combinado_${leftSafe}_${rightSafe}_${getTodayStamp()}.xlsx`;
    if (window.XLSX) {
      exportXLSX(cols, rows, filename);
    } else {
      const csv = toCSV(cols, rows);
      const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.replace(/\.xlsx$/, '.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  });

  showChartBtn?.addEventListener('click', () => {
    chartOverlay?.classList.add('show');
    if (chartGroupSelect && chartColumnSelect) {
      chartGroupSelect.value = chartColumnSelect.value || combinedColumns[0];
    }
    renderChart(chartColumnSelect?.value || combinedColumns[0], chartCanvas);
  });

  closeChartBtn?.addEventListener('click', () => {
    chartOverlay?.classList.remove('show');
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  });

  chartColumnSelect?.addEventListener('change', () => {
    renderChart(chartColumnSelect.value, chartCanvas);
  });

  chartGroupSelect?.addEventListener('change', () => {
    if (chartColumnSelect) chartColumnSelect.value = chartGroupSelect.value;
    renderChart(chartGroupSelect.value, chartCanvas);
  });
}

function toCSV(cols, rows) {
  const lines = [];
  lines.push(cols.join(','));
  for (const r of rows) {
    const vals = cols.map(c => {
      let v = r?.[c];
      if (v == null) v = '';
      v = String(v).replace(/"/g, '""');
      return '"' + v + '"';
    });
    lines.push(vals.join(','));
  }
  return lines.join('\n');
}

function renderChart(column, chartCanvas) {
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

init();