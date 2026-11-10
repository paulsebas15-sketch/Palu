/*
 * GRÁFICOS (SVG propio, sin librerías):
 *  1) Torta de gastos por categoría del periodo (porcentaje + valor en $)
 *  2) Histórico de una categoría en los últimos 6 periodos (toca una barra para ver el valor exacto)
 *  3) Ahorro por periodo (mejor y menor, toca una barra para ver el detalle)
 * Se muestran en Gastos → Presupuesto (1 y 2) y Gastos → Ahorro (3).
 */

const PALETA = ['#7F77DD', '#D85A30', '#1D9E75', '#D4537E', '#BA7517', '#378ADD', '#639922', '#E24B4A', '#534AB7', '#0F9EA8', '#B14FC5', '#8C6A3F'];
const colorCat = n => { const i = S.cats.findIndex(c => c.n === n); return i < 0 ? '#888780' : PALETA[i % PALETA.length]; };
const compacto = v => v >= 1e6 ? '$ ' + (v / 1e6).toFixed(1).replace('.', ',') + ' M' : v >= 1e3 ? '$ ' + Math.round(v / 1e3) + ' k' : '$ ' + Math.round(v);
const mesCorto = p => MESES[+p.slice(5, 7) - 1].slice(0, 3);
const periodosHasta = (p, n) => Array.from({ length: n }, (_, i) => addMes(p, i - (n - 1)));
const enc = s => encodeURIComponent(s).replace(/'/g, '%27');
const pctTxt = (v, total) => { const p = v / total * 100; return p < 1 ? '<1%' : Math.round(p) + '%'; };

// Primer periodo con datos: los periodos anteriores no se cuentan como "ahorro cero" ni "gasto cero"
function primerPeriodo() {
  const ps = [...S.gastos.map(perDe), ...S.ahorros.map(x => x.mes)].filter(Boolean).sort();
  return ps[0] || periodoActual();
}
// Tope "redondo" para el eje vertical
function escala(max) {
  if (max <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(max))), m = max / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}

/* ---------------- 1) TORTA ---------------- */
function graficoTorta(m) {
  const f = ui.graf.filtro;
  const filas = S.cats.filter(c => f === 'todo' || c.t === f).map(c => ({ n: c.n, ico: ico('cats', c), v: ejec(m, c.n), b: +((S.presu[m] || {})[c.n]) || 0 })).filter(x => x.v > 0);
  if (f === 'todo') { // gastos de categorías que ya no existen
    const conocidas = new Set(S.cats.map(c => c.n));
    const otras = S.gastos.filter(g => perDe(g) === m && !conocidas.has(g.cat)).reduce((s, g) => s + +g.valor, 0);
    if (otras > 0) filas.push({ n: 'Otras', ico: '📦', v: otras, b: 0 });
  }
  filas.sort((a, b) => b.v - a.v);
  const total = filas.reduce((s, x) => s + x.v, 0);
  const chips = `<div class="chips">${[['todo', 'Todo'], ['fija', 'Fijos'], ['variable', 'Variables']].map(([k, l]) => `<span class="chip ${f === k ? 'on' : ''}" onclick="selFiltro('${k}')">${l}</span>`).join('')}</div>`;
  const cab = `<h3>🥧 ¿En qué gastamos?</h3><div class="mut" style="margin-bottom:8px">${mesNombre(m)} (${periodoTxt(m)})</div>${chips}`;
  if (!total) return `<div class="card">${cab}<p class="mut">Aún no hay gastos en este periodo para graficar.</p></div>`;

  const sel = filas.find(x => x.n === ui.graf.pieSel) || null;
  const C = 2 * Math.PI * 62; let cum = 0;
  const arcos = filas.map(x => {
    const len = x.v / total * C, esSel = sel && sel.n === x.n;
    const c = `<circle r="62" fill="none" stroke="${colorCat(x.n)}" stroke-width="${esSel ? 40 : 32}" stroke-dasharray="${Math.max(len - 1.5, 0.5)} ${C}" stroke-dashoffset="${-cum}" transform="rotate(-90)" opacity="${sel && !esSel ? 0.35 : 1}" style="cursor:pointer" onclick="selPie('${enc(x.n)}')"/>`;
    cum += len; return c;
  }).join('');
  const centro = sel
    ? `<text y="-14" text-anchor="middle" font-size="11" style="fill:var(--mut)">${esc(sel.n.length > 16 ? sel.n.slice(0, 15) + '…' : sel.n)}</text><text y="4" text-anchor="middle" font-size="14" font-weight="600" style="fill:var(--txt)">${money(sel.v)}</text><text y="20" text-anchor="middle" font-size="12" style="fill:var(--mut)">${pctTxt(sel.v, total)}</text>`
    : `<text y="-6" text-anchor="middle" font-size="11" style="fill:var(--mut)">Total</text><text y="14" text-anchor="middle" font-size="14" font-weight="600" style="fill:var(--txt)">${money(total)}</text>`;
  const leyenda = filas.map(x => `<div class="leg-row ${sel && sel.n === x.n ? 'on' : ''}" onclick="selPie('${enc(x.n)}')"><span><i class="dot" style="background:${colorCat(x.n)}"></i>${x.ico} ${esc(x.n)}</span><span style="text-align:right"><b>${money(x.v)}</b> <span class="mut">· ${pctTxt(x.v, total)}</span></span></div>`).join('');
  const extra = sel && sel.b ? `<div class="note" style="margin:8px 0 0">Presupuesto de ${esc(sel.n)}: ${money(sel.b)} · ${sel.v > sel.b ? 'te pasaste por ' + money(sel.v - sel.b) : 'quedan ' + money(sel.b - sel.v)}</div>` : '';
  return `<div class="card">${cab}
    <svg viewBox="0 0 170 170" style="width:190px;max-width:60%;display:block;margin:0 auto 10px" role="img" aria-label="Torta de gastos por categoría"><g transform="translate(85 85)">${arcos}${centro}</g></svg>
    ${leyenda}${extra}<div class="mut" style="margin-top:6px">Toca una porción o un nombre para ver el detalle.</div></div>`;
}

/* ---------------- 2) HISTÓRICO POR CATEGORÍA ---------------- */
function graficoHistorico() {
  if (!S.cats.length) return '';
  const cat = S.cats.some(c => c.n === ui.graf.histCat) ? ui.graf.histCat : (S.cats.find(c => S.gastos.some(g => g.cat === c.n)) || S.cats[0]).n;
  const ps = periodosHasta(S.periodo, 6), first = primerPeriodo(), act = periodoActual();
  const vals = ps.map(p => ({ p, v: ejec(p, cat), b: +((S.presu[p] || {})[cat]) || 0, ok: p >= first }));
  const selP = ps.includes(ui.graf.histSel) ? ui.graf.histSel : S.periodo;
  const top = escala(Math.max(...vals.map(x => Math.max(x.v, x.b)), 1));
  const X0 = 46, SLOT = (326 - X0) / 6, BASE = 130, ALTO = 112, yv = v => BASE - (v / top) * ALTO;
  const col = colorCat(cat);

  const barras = vals.map((x, i) => {
    const cx = X0 + i * SLOT + SLOT / 2, esSel = x.p === selP;
    const h = x.ok && x.v > 0 ? Math.max(3, (x.v / top) * ALTO) : 0;
    return `<g style="cursor:pointer" onclick="selHist('${x.p}')">
      <rect x="${X0 + i * SLOT}" y="8" width="${SLOT}" height="${BASE + 16 - 8}" fill="transparent"/>
      ${h ? `<rect x="${cx - 15}" y="${BASE - h}" width="30" height="${h}" rx="4" fill="${col}" opacity="${esSel ? 1 : 0.5}"/><text x="${cx}" y="${BASE - h - 4}" font-size="9" text-anchor="middle" style="fill:var(--txt);paint-order:stroke;stroke:var(--card2);stroke-width:3px;stroke-linejoin:round">${compacto(x.v)}</text>` : ''}
      ${x.b > 0 ? `<line x1="${cx - SLOT / 2 + 3}" x2="${cx + SLOT / 2 - 3}" y1="${yv(x.b)}" y2="${yv(x.b)}" stroke="var(--txt)" stroke-width="1.2" stroke-dasharray="4 3"/>` : ''}
      <text x="${cx}" y="${BASE + 16}" font-size="10" text-anchor="middle" style="fill:${esSel ? 'var(--txt)' : 'var(--mut)'};font-weight:${esSel ? 600 : 400}">${mesCorto(x.p)}</text></g>`;
  }).join('');
  const ejeY = [0, top / 2, top].map(v => `<text x="0" y="${yv(v) + 3}" font-size="9" style="fill:var(--mut)">${compacto(v)}</text><line x1="${X0}" x2="326" y1="${yv(v)}" y2="${yv(v)}" stroke="var(--line)" stroke-width="0.6"/>`).join('');

  const s = vals.find(x => x.p === selP), prevP = addMes(selP, -1), pv = ejec(prevP, cat);
  let det = `<b>${mesNombre(selP)}</b> · ${ico('cats', S.cats.find(c => c.n === cat))} ${esc(cat)}: <b>${money(s.v)}</b>`;
  if (s.b) det += `<br>Presupuesto: ${money(s.b)} · ${s.v > s.b ? '<span style="color:var(--bad)">sobre por ' + money(s.v - s.b) + '</span>' : '<span style="color:var(--ok)">bajo por ' + money(s.b - s.v) + '</span>'}`;
  else det += `<br><span class="mut">Sin presupuesto definido para este periodo.</span>`;
  if (pv > 0 && prevP >= first) { const d = (s.v - pv) / pv * 100; det += `<br>${d >= 0 ? '▲' : '▼'} ${Math.abs(Math.round(d))}% ${d >= 0 ? 'más' : 'menos'} que ${mesNombre(prevP).split(' ')[0]} (${money(pv)})`; }
  const conDatos = vals.filter(x => x.ok && x.p <= act);
  const prom = conDatos.length ? conDatos.reduce((a, x) => a + x.v, 0) / conDatos.length : 0;

  const chips = `<div class="chips">${S.cats.map(c => `<span class="chip ${c.n === cat ? 'on' : ''}" onclick="selHistCat('${enc(c.n)}')">${ico('cats', c)} ${esc(c.n)}</span>`).join('')}</div>`;
  return `<div class="card"><h3>📈 Histórico por categoría</h3><div class="mut" style="margin-bottom:8px">Últimos 6 periodos · la línea punteada es el <b>presupuesto</b> de cada periodo</div>${chips}
    <svg viewBox="0 0 330 150" style="width:100%;height:auto" role="img" aria-label="Gasto por periodo en ${esc(cat)}">${ejeY}${barras}</svg>
    <div class="note" style="margin:8px 0">${det}</div>
    <div class="mut">Promedio de los periodos con datos: <b>${money(Math.round(prom))}</b> · Toca una barra para ver el valor exacto.</div></div>`;
}

/* ---------------- 3) AHORRO POR PERIODO ---------------- */
function graficoAhorro() {
  const ps = periodosHasta(S.periodo, 6), first = primerPeriodo(), act = periodoActual();
  const vals = ps.map(p => { const l = S.ahorros.filter(a => a.mes === p); return { p, l, v: l.reduce((s, a) => s + +a.valor, 0), ok: p >= first && p <= act }; });
  // Para "mejor", "menor" y promedio: periodos con datos que ya cerraron, o el actual si ya tiene ahorro (aún no termina)
  const con = vals.filter(x => x.ok && (x.p < act || x.v > 0));
  if (!con.some(x => x.v > 0)) return `<div class="card"><h3>📊 Ahorro por periodo</h3><p class="mut">Cuando registren ingresos al ahorro, aquí verán en qué periodo ahorraron más y en cuál menos.</p></div>`;
  const best = con.reduce((a, x) => x.v > a.v ? x : a, con[0]), worst = con.reduce((a, x) => x.v < a.v ? x : a, con[0]);
  const hayPeor = worst.v < best.v;
  const prom = con.reduce((a, x) => a + x.v, 0) / con.length;
  const selP = ps.includes(ui.graf.ahoSel) ? ui.graf.ahoSel : S.periodo;
  const top = escala(Math.max(...vals.map(x => x.v), 1));
  const X0 = 46, SLOT = (326 - X0) / 6, BASE = 120, ALTO = 100, yv = v => BASE - (v / top) * ALTO;

  const barras = vals.map((x, i) => {
    const cx = X0 + i * SLOT + SLOT / 2, esSel = x.p === selP;
    const color = !x.ok ? 'var(--line)' : x.p === best.p ? 'var(--ok)' : hayPeor && x.p === worst.p ? 'var(--bad)' : 'var(--acc)';
    const h = !x.ok ? 0 : Math.max(3, (x.v / top) * ALTO);
    return `<g style="cursor:pointer" onclick="selAho('${x.p}')">
      <rect x="${X0 + i * SLOT}" y="6" width="${SLOT}" height="${BASE + 20 - 6}" fill="transparent"/>
      ${x.ok ? `<rect x="${cx - 15}" y="${BASE - h}" width="30" height="${h}" rx="4" fill="${color}" opacity="${esSel ? 1 : 0.6}"/><text x="${cx}" y="${BASE - h - 4}" font-size="9" text-anchor="middle" style="fill:var(--txt);paint-order:stroke;stroke:var(--card2);stroke-width:3px;stroke-linejoin:round">${compacto(x.v)}</text>` : `<text x="${cx}" y="${BASE - 6}" font-size="10" text-anchor="middle" style="fill:var(--mut)">—</text>`}
      <text x="${cx}" y="${BASE + 16}" font-size="10" text-anchor="middle" style="fill:${esSel ? 'var(--txt)' : 'var(--mut)'};font-weight:${esSel ? 600 : 400}">${mesCorto(x.p)}</text></g>`;
  }).join('');
  const ejeY = [0, top / 2, top].map(v => `<text x="0" y="${yv(v) + 3}" font-size="9" style="fill:var(--mut)">${compacto(v)}</text><line x1="${X0}" x2="326" y1="${yv(v)}" y2="${yv(v)}" stroke="var(--line)" stroke-width="0.6"/>`).join('');

  const s = vals.find(x => x.p === selP);
  const porPersona = PEOPLE.map(p => ({ p, v: s.l.filter(a => a.quien === p).reduce((t, a) => t + +a.valor, 0) })).filter(x => x.v > 0);
  const det = !s.ok ? `<b>${mesNombre(selP)}</b>: sin datos todavía.`
    : `<b>${mesNombre(selP)}</b>: ahorraron <b>${money(s.v)}</b> en ${s.l.length} ingreso${s.l.length === 1 ? '' : 's'}${porPersona.length ? '<br>' + porPersona.map(x => `<span style="color:${pc(x.p)}">${x.p}</span> ${money(x.v)}`).join(' · ') : ''}`;
  return `<div class="card"><h3>📊 Ahorro por periodo</h3><div class="mut" style="margin-bottom:8px">Últimos 6 periodos · verde = el mejor · rojo = el menor</div>
    <svg viewBox="0 0 330 146" style="width:100%;height:auto" role="img" aria-label="Ahorro por periodo">${ejeY}${barras}</svg>
    <div class="chips" style="margin-top:8px"><span class="chip" style="color:var(--ok)">🏆 Mejor: ${mesNombre(best.p).split(' ')[0]} (${money(best.v)})</span>${hayPeor ? `<span class="chip" style="color:var(--bad)">⚠️ Menor: ${mesNombre(worst.p).split(' ')[0]} (${money(worst.v)})</span>` : ''}<span class="chip">Promedio: ${money(Math.round(prom))}</span></div>
    <div class="note" style="margin:6px 0 0">${det}</div><div class="mut" style="margin-top:6px">Toca una barra para ver el detalle. Cuenta los ingresos al ahorro registrados en cada periodo (25 al 24).</div></div>`;
}

/* ---- Selecciones (cada toque vuelve a dibujar) ---- */
function selFiltro(k) { ui.graf.filtro = k; ui.graf.pieSel = null; render(); }
function selPie(n) { n = decodeURIComponent(n); ui.graf.pieSel = ui.graf.pieSel === n ? null : n; render(); }
function selHistCat(n) { ui.graf.histCat = decodeURIComponent(n); ui.graf.histSel = null; render(); }
function selHist(p) { ui.graf.histSel = p; render(); }
function selAho(p) { ui.graf.ahoSel = p; render(); }
