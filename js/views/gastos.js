/* Sección GASTOS: resumen/nivelación, lista, presupuesto, ahorro. Todo por PERIODO (25 al 24). */

// Periodo al que cuenta un gasto: el elegido a mano, o el que corresponde a su fecha
const perDe = x => x.periodo || periodoDe(x.fecha);

function totales(p) {
  const g = S.gastos.filter(x => perDe(x) === p), a = { Paul: 0, Luisa: 0 };
  g.forEach(x => { a[x.quien] += +x.valor; });
  const dif = Math.abs(a.Paul - a.Luisa);
  const menos = a.Paul < a.Luisa ? 'Paul' : a.Luisa < a.Paul ? 'Luisa' : null;
  const ah = S.ahorros.filter(x => x.mes === p).reduce((s, x) => s + +x.valor, 0);
  return { g, a, tot: a.Paul + a.Luisa, dif, menos, ah, pend: menos ? Math.max(0, dif - ah) : 0 };
}
const catIco = n => ico('cats', S.cats.find(c => c.n === n) || { n });
const ahorroTotal = () => S.ahorros.reduce((s, x) => s + +x.valor, 0);
const ejec = (p, cat) => S.gastos.filter(x => perDe(x) === p && x.cat === cat).reduce((s, x) => s + +x.valor, 0);

// Opciones de periodo alrededor de "centro" (y siempre incluye "sel")
function periodoOpts(sel, centro) {
  const ps = new Set([addMes(centro, -1), centro, addMes(centro, 1), addMes(centro, 2), sel]);
  return [...ps].sort().map(p => `<option value="${p}" ${p === sel ? 'selected' : ''}>${mesNombre(p)} (${periodoTxt(p)})</option>`).join('');
}

function vGastos() {
  const s = ui.sub.gastos, m = S.periodo, t = totales(m);
  let h = seg('gastos', [['resumen', '📊 Resumen'], ['lista', '🧾 Lista'], ['presu', '🎯 Presupuesto'], ['ahorro', '🐷 Ahorro']]) + periodoSel();

  if (s === 'resumen') {
    h += `<div class="grid2">${PEOPLE.map(p => `<div class="card"><div class="mut"><span class="dot" style="background:${pc(p)}"></span>${p} aportó</div><div class="big" style="font-size:20px">${money(t.a[p])}</div></div>`).join('')}</div>
    <div class="card"><div class="mut">Total del periodo (a la mitad)</div><div class="big">${money(t.tot)}</div><div class="mut">Cada uno equivale a ${money(Math.round(t.tot / 2))}</div></div>
    <div class="card"><h3>⚖️ Nivelación</h3>${t.menos
      ? `<p><b style="color:${pc(t.menos)}">${t.menos}</b> aportó menos. Diferencia: ${money(t.dif)}. Ya enviado al ahorro: ${money(t.ah)}.</p><div class="big" style="font-size:22px">Saldo pendiente: ${money(t.pend)}</div>${t.pend > 0 ? `<br><button class="btn" onclick="formAhorro(${t.pend})">Registrar ingreso a ahorro</button>` : '<p class="mut">Saldo en cero ✓ Nada que devolver.</p>'}`
      : '<p class="mut">Aportaron lo mismo. Saldo en cero.</p>'}</div>
    <div class="card"><div class="mut">Ahorro acumulado</div><div class="big">${money(ahorroTotal())}</div></div>`;
  }

  if (s === 'lista') {
    h += `<div class="card">${t.g.length ? [...t.g].sort((a, b) => b.fecha.localeCompare(a.fecha)).map(x => `<div class="item" onclick="formGasto('${x.id}')"><div><b><span class="emo">${catIco(x.cat)}</span>${esc(x.cat)}</b><div class="mut">${fechaTxt(x.fecha)}${x.nota ? ' · ' + esc(x.nota) : ''}</div>${perDe(x) !== periodoDe(x.fecha) ? `<span class="chip">📆 anticipado: cuenta para ${mesNombre(perDe(x))}</span>` : ''}</div><div style="text-align:right"><b>${money(x.valor)}</b><div class="mut" style="color:${pc(x.quien)}">${x.quien}</div></div></div>`).join('') : '<p class="mut">Sin gastos en este periodo. Toca ＋ para agregar.</p>'}</div>`;
  }

  if (s === 'presu') {
    const p = S.presu[m] || {}; let tp = 0, te = 0;
    h += `<div class="row" style="margin-bottom:10px"><button class="btn sec sm" onclick="copiarPresu()">Copiar periodo anterior</button><button class="btn sec sm" onclick="formCats()">Categorías</button></div>`;
    h += ['fija', 'variable'].map(tipo => `<h2>${tipo === 'fija' ? '📌 Fijos' : '🔄 Variables'}</h2><div class="card">${S.cats.filter(c => c.t === tipo).map(c => {
      const b = +p[c.n] || 0, e = ejec(m, c.n); tp += b; te += e;
      const pct = b ? Math.min(100, e / b * 100) : 0;
      const col = !b ? 'var(--mut)' : e > b ? 'var(--bad)' : e > b * .85 ? 'var(--warn)' : 'var(--ok)';
      return `<div style="margin-bottom:12px"><div class="row"><b><span class="emo">${ico('cats', c)}</span>${esc(c.n)}</b><span class="mut">${money(e)} / <input class="inline-in" type="number" inputmode="numeric" value="${b || ''}" placeholder="Presupuesto" onchange="setPresu('${esc(c.n)}',this.value)"></span></div><div class="bar" style="margin-top:6px"><i style="width:${pct}%;background:${col}"></i></div></div>`;
    }).join('')}</div>`).join('');
    h += `<div class="card"><div class="row"><b>Total</b><span>${money(te)} de ${money(tp)}</span></div></div>`;
  }

  if (s === 'ahorro') {
    const lista = [...S.ahorros].sort((a, b) => b.fecha.localeCompare(a.fecha));
    h += `<div class="card"><div class="mut">Ahorro acumulado</div><div class="big">${money(ahorroTotal())}</div><br><button class="btn" onclick="formAhorro(${t.pend})">Registrar ingreso a ahorro</button></div>
    <div class="card"><h3>Historial</h3>${lista.length ? lista.map(x => `<div class="item" onclick="delAhorro('${x.id}')"><div><b>${money(x.valor)}</b><div class="mut">${fechaTxt(x.fecha)} · ${x.quien} · periodo ${mesNombre(x.mes)}</div></div><span class="mut">quitar</span></div>`).join('') : '<p class="mut">Aún no hay ingresos al ahorro.</p>'}</div>`;
  }
  return h;
}

function setPresu(c, v) { Data.setPresu(S.periodo, c, +v || 0); render(); }
function copiarPresu() {
  const ant = S.presu[addMes(S.periodo, -1)];
  if (!ant) return toast('El periodo anterior no tiene presupuesto');
  Object.entries(ant).forEach(([c, v]) => Data.setPresu(S.periodo, c, v));
  render();
}

/* ---- Gasto: el periodo se sugiere por la fecha (corte día 25) y se puede cambiar (gasto anticipado) ---- */
let _perTocado = false;
function formGasto(id) {
  const g = S.gastos.find(x => x.id === id) || { fecha: today(), cat: S.cats[0] ? S.cats[0].n : '', valor: '', quien: S.me, nota: '' };
  _perTocado = !!id; // al editar, no se recalcula el periodo si cambias la fecha; al crear, sigue a la fecha hasta que lo cambies
  const per = id ? perDe(g) : periodoDe(g.fecha);
  openSheet(`<h2>${id ? 'Editar gasto' : 'Nuevo gasto'}</h2>
  <label>Categoría<select id="g_cat">${S.cats.map(c => `<option value="${esc(c.n)}" ${c.n === g.cat ? 'selected' : ''}>${ico('cats', c)} ${esc(c.n)}</option>`).join('')}</select></label>
  <label>Valor (COP)<input id="g_val" type="number" inputmode="numeric" value="${g.valor}"></label>
  <label>Quién pagó<select id="g_q">${PEOPLE.map(p => `<option ${p === g.quien ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
  <label>Fecha del gasto<input id="g_f" type="date" value="${g.fecha}" onchange="fechaGasto()"></label>
  <label>Cuenta para el periodo<select id="g_p" onchange="_perTocado=true">${periodoOpts(per, periodoDe(g.fecha))}</select></label>
  <div class="mut">El periodo va del 25 al 24. Para un gasto anticipado, escoge el mes siguiente.</div>
  <label>Nota (opcional)<input id="g_n" value="${esc(g.nota)}"></label><div id="err" class="err"></div><br>
  <div class="row"><button class="btn" onclick="saveGasto('${id || ''}')">Guardar</button>${id ? `<button class="btn bad" onclick="delGasto('${id}')">Eliminar</button>` : ''}</div>`);
}
function fechaGasto() {
  if (_perTocado) return;
  const f = $('#g_f').value; if (!f) return;
  const p = periodoDe(f);
  $('#g_p').innerHTML = periodoOpts(p, p);
}
function saveGasto(id) {
  const v = +$('#g_val').value;
  if (!v || v <= 0) return $('#err').textContent = 'Ingresa un valor mayor a 0';
  const fecha = $('#g_f').value || today();
  const o = { cat: $('#g_cat').value, valor: v, quien: $('#g_q').value, fecha, periodo: $('#g_p').value || periodoDe(fecha), nota: $('#g_n').value };
  if (id) Data.upd('gastos', id, o); else Data.add('gastos', o);
  S.periodo = o.periodo; closeSheet(); ui.tab = 'gastos'; render();
}
function delGasto(id) { if (confirm('¿Eliminar este gasto?')) { Data.del('gastos', id); closeSheet(); render(); } }

function formAhorro(sug) {
  openSheet(`<h2>Ingreso a ahorro</h2><p class="mut">Regístralo solo cuando la transferencia ya se hizo.</p>
  <label>Valor (COP)<input id="a_v" type="number" inputmode="numeric" value="${sug || ''}"></label>
  <label>Quién transfirió<select id="a_q">${PEOPLE.map(p => `<option ${p === (totales(S.periodo).menos || S.me) ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
  <label>Periodo que nivela<select id="a_m">${periodoOpts(S.periodo, S.periodo)}</select></label><div id="err" class="err"></div><br>
  <button class="btn" onclick="saveAhorro()">Guardar</button>`);
}
function saveAhorro() {
  const v = +$('#a_v').value;
  if (!v || v <= 0) return $('#err').textContent = 'Ingresa un valor mayor a 0';
  Data.add('ahorros', { valor: v, quien: $('#a_q').value, mes: $('#a_m').value || S.periodo, fecha: today() });
  closeSheet(); ui.tab = 'gastos'; render();
}
function delAhorro(id) { if (confirm('¿Quitar este ingreso al ahorro?')) { Data.del('ahorros', id); render(); } }

function formCats() {
  openSheet(`<h2>Categorías</h2>${S.cats.map(c => `<div class="item" onclick="delCat('${c.id}')"><span><span class="emo">${ico('cats', c)}</span>${esc(c.n)} <span class="chip">${c.t}</span></span><span class="mut">quitar</span></div>`).join('')}
  <label>Nueva categoría<input id="c_n"></label><label>Ícono</label>${emojiPicker('c_i', 'cats', '🧾')}<label>Tipo<select id="c_t"><option value="fija">Fija</option><option value="variable">Variable</option></select></label><br><button class="btn" onclick="addCat()">Agregar</button>`);
}
function addCat() { const n = $('#c_n').value.trim(); if (!n) return; Data.add('cats', { n, t: $('#c_t').value, icono: $('#c_i').value || '🧾' }); formCats(); render(); }
function delCat(id) { if (confirm('¿Quitar categoría? Los gastos ya registrados se conservan.')) { Data.del('cats', id); formCats(); render(); } }
