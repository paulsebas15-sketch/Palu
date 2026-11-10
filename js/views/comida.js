/* Sección COMIDA: cuotas con ventana móvil, calendario por día, rachas, penalizaciones, reglas */

const regla = id => S.reglas.find(r => r.id === id);
const reglaIco = id => ico('reglas', regla(id) || { id });

// Comidas de la persona p en la ventana móvil de la regla r, contando hacia atrás desde ref
function usosEn(r, p, ref) {
  return S.pecados.filter(x => x.cat === r.id && (x.quien === p || x.quien === 'Juntos') && diffDays(ref, x.fecha) < r.d && diffDays(ref, x.fecha) >= 0).map(x => x.fecha).sort();
}
function estadoEn(r, p, ref) {
  const u = usosEn(r, p, ref), libres = Math.max(0, r.q - u.length);
  if (u.length < r.q) return { libres, used: u.length, dias: 0, deuda: 0 };
  const rel = addDays(u[u.length - r.q], r.d); // día en que se libera la próxima cuota
  return { libres: 0, used: u.length, dias: Math.max(1, diffDays(rel, ref)), deuda: u.length - r.q };
}

function vComida() {
  const s = ui.sub.comida;
  let h = seg('comida', [['panel', 'Panel'], ['cal', 'Calendario'], ['rachas', 'Rachas'], ['pen', 'Penalizaciones'], ['reglas', 'Reglas']]);

  if (s === 'panel') {
    h += S.reglas.map(r => `<div class="card"><h3><span class="emo">${ico('reglas', r)}</span>${esc(r.n)}</h3><div class="mut">${r.q} cada ${r.d} días</div>${PEOPLE.map(p => {
      const e = estadoEn(r, p, today());
      const col = e.libres === r.q ? 'var(--ok)' : e.libres > 0 ? 'var(--warn)' : 'var(--bad)';
      const txt = e.libres > 0 ? 'Disponible ✓' : 'Disponible en ' + e.dias + ' día' + (e.dias > 1 ? 's' : '') + (e.deuda ? ' · debes ' + e.deuda : '');
      return `<div style="margin-top:10px"><div class="row"><span><span class="dot" style="background:${pc(p)}"></span>${p}</span><span class="mut">${txt}</span></div><div class="bar" style="margin-top:4px"><i style="width:${e.libres / r.q * 100}%;background:${col}"></i></div></div>`;
    }).join('')}</div>`).join('');
  }

  if (s === 'cal') {
    const m = S.month, sel = selDia('comida', m);
    const delDia = f => S.pecados.filter(x => x.fecha === f);
    const mes = S.pecados.filter(x => x.fecha.startsWith(m));
    const ps = delDia(sel);
    h += mesSel() + `<div class="card">${calGrid('comida', m, f => {
      const d = delDia(f);
      return d.length ? `<span class="ee">${d.slice(0, 4).map(x => reglaIco(x.cat)).join('')}</span><span class="dd">${d.slice(0, 4).map(x => x.quien === 'Juntos' ? '<i style="background:var(--paul)"></i><i style="background:var(--luisa)"></i>' : `<i style="background:${pc(x.quien)}"></i>`).join('')}</span>` : '';
    })}<div class="mut" style="margin-top:8px"><span class="dot" style="background:var(--paul)"></span>Paul <span class="dot" style="background:var(--luisa)"></span>Luisa · Juntos = dos puntos · Toca un día para ver qué comieron</div></div>
    <div class="card"><div class="row"><h3>${fechaTxt(sel)}${sel === today() ? ' · hoy' : ''}</h3><button class="btn sm" onclick="formPecado('${sel}')">＋ Comida</button></div>
    ${ps.map(x => `<div class="item" style="cursor:default"><div><b><span class="emo">${reglaIco(x.cat)}</span>${esc(regla(x.cat) ? regla(x.cat).n : x.cat)}</b><div style="margin:2px 0">${esc(x.nota)}</div><div class="mut"><span style="color:${pc(x.quien)}">${x.quien === 'Juntos' ? 'Paul y Luisa' : x.quien}</span>${x.pen ? ' · ' + (x.pen === 'prestamo' ? 'cuota prestada' : 'con reto') : ''}</div></div><button class="btn sec sm" onclick="delPecado('${x.id}')">Quitar</button></div>`).join('') || '<p class="mut">No se registró comida este día.</p>'}</div>
    <div class="note">Comidas registradas en ${mesNombre(m)}: ${mes.length}</div>`;
  }

  if (s === 'rachas') {
    const lines = S.reglas.map(r => {
      const offs = S.pecados.filter(x => x.cat === r.id && x.pen).map(x => x.fecha).sort();
      return { r, d: diffDays(today(), offs.length ? offs[offs.length - 1] : S.inicio) };
    }).filter(l => l.d >= 7);
    h += `<div class="card"><h3>🔥 Cómo van</h3>${lines.length ? lines.map(l => `<p>${ico('reglas', l.r)} Llevas ${l.d >= 30 ? Math.floor(l.d / 30) + (Math.floor(l.d / 30) > 1 ? ' meses' : ' mes') : l.d + ' días'} cumpliendo con ${esc(l.r.n.toLowerCase())}, vas bien.</p>`).join('') : '<p class="mut">Aún no hay rachas de una semana. ¡A por ellas!</p>'}</div>`;
    const mes = S.pecados.filter(x => x.fecha.startsWith(today().slice(0, 7)));
    h += `<div class="card"><h3>📊 Este mes</h3><p>Juntos: ${mes.filter(x => x.quien === 'Juntos').length} · Paul: ${mes.filter(x => x.quien === 'Paul').length} · Luisa: ${mes.filter(x => x.quien === 'Luisa').length}</p><p class="mut">Fuera de regla: ${mes.filter(x => x.pen).length}</p></div>`;
  }

  if (s === 'pen') {
    h += `<div class="card"><h3>💪 Retos pendientes</h3>${S.retosPend.filter(x => !x.hecho).map(x => `<div class="item"><div><b>${esc(x.texto)}</b><div class="mut" style="color:${pc(x.quien)}">${x.quien}</div></div><button class="btn sm" onclick="retoHecho('${x.id}')">Hecho</button></div>`).join('') || '<p class="mut">No hay retos pendientes.</p>'}</div>`;
    const deudas = S.reglas.flatMap(r => PEOPLE.map(p => ({ r, p, e: estadoEn(r, p, today()) }))).filter(x => x.e.deuda > 0);
    h += `<div class="card"><h3>⏳ Cuotas prestadas</h3>${deudas.map(x => `<p>${ico('reglas', x.r)} <span style="color:${pc(x.p)}">${x.p}</span>: ${esc(x.r.n)}, debe ${x.e.deuda}. Libre en ${x.e.dias} d.</p>`).join('') || '<p class="mut">Sin deudas.</p>'}</div>`;
  }

  if (s === 'reglas') {
    h += `<div class="card"><h3>📋 Reglas (iguales para los dos)</h3>${S.reglas.map(r => `<div class="item" onclick="formRegla('${r.id}')"><span><span class="emo">${ico('reglas', r)}</span>${esc(r.n)}</span><span class="mut">${r.q} cada ${r.d} d ›</span></div>`).join('')}</div>
    <div class="card"><h3>💪 Lista de retos</h3>${S.retos.map(r => `<div class="item" onclick="delReto('${r.id}')"><span>${esc(r.texto)}</span><span class="mut">quitar</span></div>`).join('')}<label>Nuevo reto<input id="r_n"></label><br><button class="btn sm" onclick="addReto()">Agregar reto</button></div>`;
  }
  return h;
}

function formRegla(id) {
  const r = regla(id);
  openSheet(`<h2>${ico('reglas', r)} ${esc(r.n)}</h2><label>Ícono</label>${emojiPicker('rg_i', 'reglas', ico('reglas', r))}
  <label>Cuota (veces permitidas)<input id="q" type="number" value="${r.q}"></label><label>Ventana (días)<input id="d" type="number" value="${r.d}"></label><br>
  <button class="btn" onclick="Data.upd('reglas','${id}',{q:+$('#q').value||1,d:+$('#d').value||7,icono:$('#rg_i').value});closeSheet();render()">Guardar</button>`);
}
function addReto() { const v = $('#r_n').value.trim(); if (!v) return; Data.add('retos', { texto: v }); render(); }
function delReto(id) { Data.del('retos', id); render(); }
function retoHecho(id) { Data.upd('retosPend', id, { hecho: true }); render(); }
function delPecado(id) { if (confirm('¿Quitar este registro de comida?')) { Data.del('pecados', id); render(); } }

// Registrar comida. fecha opcional (para registrar un día anterior desde el calendario)
function formPecado(fecha) {
  openSheet(`<h2>🍽️ Registrar comida</h2>
  <label>Categoría<select id="p_c">${S.reglas.map(r => `<option value="${r.id}">${ico('reglas', r)} ${esc(r.n)}</option>`).join('')}</select></label>
  <label>Quién comió<select id="p_q"><option>Paul</option><option>Luisa</option><option>Juntos</option></select></label>
  <label>Fecha<input id="p_f" type="date" value="${fecha || today()}" max="${today()}"></label>
  <label>¿Qué comieron? (obligatorio)<input id="p_n" placeholder="Ej: hamburguesa con papas"></label>
  <div id="err" class="err"></div><br>
  <button class="btn" onclick="pasoPecado()">Guardar</button>`);
  $('#p_q').value = S.me;
}

let _pec = null;
function pasoPecado() {
  const c = $('#p_c').value, q = $('#p_q').value, f = $('#p_f').value || today(), n = $('#p_n').value.trim();
  if (!n) return $('#err').textContent = 'Cuéntame qué comieron';
  const r = regla(c), afect = q === 'Juntos' ? PEOPLE : [q];
  const sin = afect.filter(p => estadoEn(r, p, f).libres === 0); // quién no tiene cuota ese día
  _pec = { cat: c, quien: q, fecha: f, nota: n, afect: sin };
  if (!sin.length) { Data.add('pecados', { cat: c, quien: q, fecha: f, nota: n, pen: '' }); closeSheet(); ui.tab = 'comida'; ui.dia.comida = f; S.month = f.slice(0, 7); render(); return; }
  openSheet(`<h2>Sin cuota disponible</h2><p>${sin.join(' y ')} no ${sin.length > 1 ? 'tienen' : 'tiene'} cuota de <b>${ico('reglas', r)} ${esc(r.n.toLowerCase())}</b>. Escoge una penalización:</p>
  <button class="btn" style="width:100%" onclick="guardarPec('prestamo')">⏳ Préstamo de cuota</button><p class="mut">Se consume la cuota del siguiente periodo.</p>
  <button class="btn sec" style="width:100%" onclick="guardarPec('reto')">💪 Reto compensatorio</button><p class="mut">Se asigna un reto de la lista.</p>`);
}
function guardarPec(tipo) {
  const p = _pec;
  Data.add('pecados', { cat: p.cat, quien: p.quien, fecha: p.fecha, nota: p.nota, pen: tipo });
  if (tipo === 'reto') p.afect.forEach(q => Data.add('retosPend', { texto: S.retos.length ? S.retos[Math.floor(Math.random() * S.retos.length)].texto : 'Caminata', quien: q, hecho: false }));
  closeSheet(); ui.tab = 'comida'; ui.sub.comida = tipo === 'reto' ? 'pen' : 'cal'; ui.dia.comida = p.fecha; S.month = p.fecha.slice(0, 7); render();
}
