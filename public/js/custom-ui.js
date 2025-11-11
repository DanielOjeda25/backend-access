export function renderBoxTable(containerEl, headers, rows) {
  containerEl.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'bg-gray-700 border border-gray-600 rounded-md p-3';
  const table = document.createElement('table');
  table.className = 'w-full text-sm text-gray-100';
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  headers.forEach((h) => {
    const th = document.createElement('th');
    th.className = 'text-left px-2 py-1 text-gray-400'; // encabezado más oscuro
    th.textContent = h;
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  const tbody = document.createElement('tbody');
  rows.forEach((r) => {
    const tr = document.createElement('tr');
    r.forEach((cell) => {
      const td = document.createElement('td');
      td.className = 'px-2 py-1';
      td.textContent = cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(thead);
  table.appendChild(tbody);
  box.appendChild(table);
  containerEl.appendChild(box);
}

// Convierte la primera tabla dentro de containerEl a AOA (array of arrays)
export function containerTableToAOA(containerEl) {
  if (!containerEl) return null;
  const table = containerEl.querySelector('table');
  if (!table) return null;
  const headers = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent || '');
  const rows = Array.from(table.querySelectorAll('tbody tr')).map((tr) =>
    Array.from(tr.querySelectorAll('td')).map((td) => td.textContent || '')
  );
  return [headers, ...rows];
}

// Exporta la tabla de un contenedor a .xlsx usando SheetJS; fallback: alerta si no hay datos
export function exportContainerToXLSX(containerEl, sheetName, fileBase) {
  const aoa = containerTableToAOA(containerEl);
  if (!aoa || aoa.length <= 1) {
    alert('No hay datos para exportar.');
    return;
  }
  if (window.XLSX && XLSX.utils) {
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Datos');
    XLSX.writeFile(wb, `${fileBase || 'datos'}.xlsx`);
  } else {
    alert('Biblioteca XLSX no disponible.');
  }
}