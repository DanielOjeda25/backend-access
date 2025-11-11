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