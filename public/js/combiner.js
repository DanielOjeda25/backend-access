function alignColumns(colsA, colsB) {
  const setA = new Set(colsA);
  const setB = new Set(colsB);
  const shared = colsA.filter(c => setB.has(c));
  const onlyA = colsA.filter(c => !setB.has(c));
  const onlyB = colsB.filter(c => !setA.has(c));
  return { shared, onlyA, onlyB, all: [...shared, ...onlyA.map(c=>`A:${c}`), ...onlyB.map(c=>`B:${c}`)] };
}

export function combineRows(rowsA, colsA, rowsB, colsB, mode = 'union') {
  const { shared, onlyA, onlyB } = alignColumns(colsA, colsB);
  if (mode === 'union') {
    const out = [];
    for (const r of rowsA) {
      const o = {};
      for (const c of shared) o[c] = r?.[c] ?? '';
      for (const c of onlyA) o[`A:${c}`] = r?.[c] ?? '';
      for (const c of onlyB) o[`B:${c}`] = '';
      out.push(o);
    }
    for (const r of rowsB) {
      const o = {};
      for (const c of shared) o[c] = r?.[c] ?? '';
      for (const c of onlyA) o[`A:${c}`] = '';
      for (const c of onlyB) o[`B:${c}`] = r?.[c] ?? '';
      out.push(o);
    }
    return { rows: out, columns: [...shared, ...onlyA.map(c=>`A:${c}`), ...onlyB.map(c=>`B:${c}`)] };
  }
  // Simple inner join by shared columns exact match on first shared column
  if (mode === 'inner') {
    const keyCol = shared[0];
    if (!keyCol) return { rows: [], columns: [] };
    const idxB = new Map();
    for (const r of rowsB) idxB.set(String(r?.[keyCol] ?? ''), r);
    const out = [];
    for (const rA of rowsA) {
      const k = String(rA?.[keyCol] ?? '');
      const rB = idxB.get(k);
      if (!rB) continue;
      const o = {};
      for (const c of shared) o[c] = rA?.[c] ?? rB?.[c] ?? '';
      for (const c of onlyA) o[`A:${c}`] = rA?.[c] ?? '';
      for (const c of onlyB) o[`B:${c}`] = rB?.[c] ?? '';
      out.push(o);
    }
    return { rows: out, columns: [...shared, ...onlyA.map(c=>`A:${c}`), ...onlyB.map(c=>`B:${c}`)] };
  }
  return { rows: [], columns: [] };
}

export function joinByKeys(rowsA, colsA, rowsB, colsB, keyA, keyB) {
  const setA = new Set(colsA);
  const setB = new Set(colsB);
  const shared = colsA.filter(c => setB.has(c));
  const onlyA = colsA.filter(c => !setB.has(c));
  const onlyB = colsB.filter(c => !setA.has(c));
  const idxB = new Map();
  for (const r of rowsB) {
    idxB.set(String(r?.[keyB] ?? ''), r);
  }
  const out = [];
  for (const rA of rowsA) {
    const k = String(rA?.[keyA] ?? '');
    const rB = idxB.get(k);
    if (!rB) continue;
    const o = {};
    for (const c of shared) o[c] = rA?.[c] ?? rB?.[c] ?? '';
    for (const c of onlyA) o[`A:${c}`] = rA?.[c] ?? '';
    for (const c of onlyB) o[`B:${c}`] = rB?.[c] ?? '';
    out.push(o);
  }
  return { rows: out, columns: [...shared, ...onlyA.map(c=>`A:${c}`), ...onlyB.map(c=>`B:${c}`)] };
}

export function getProjectedColumnsAB(colsA, colsB) {
  const { shared, onlyA, onlyB } = alignColumns(colsA, colsB);
  return [...shared, ...onlyA.map(c=>`A:${c}`), ...onlyB.map(c=>`B:${c}`)];
}

export function chainJoin(rowsA, colsA, rowsB, colsB, rowsC, colsC, {
  keyA, keyB, keyMid, keyC
}) {
  let ab;
  if (keyA && keyB) {
    ab = joinByKeys(rowsA, colsA, rowsB, colsB, keyA, keyB);
  } else {
    ab = combineRows(rowsA, colsA, rowsB, colsB, 'union');
  }
  let final;
  if (keyMid && keyC) {
    final = joinByKeys(ab.rows, ab.columns, rowsC, colsC, keyMid, keyC);
  } else {
    final = combineRows(ab.rows, ab.columns, rowsC, colsC, 'union');
  }
  return final;
}