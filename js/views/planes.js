/* Sección PLANES: tablero, calendario, recuerdos (muro), fechas recurrentes */

function proximaFecha() {
  const t = today();
  return S.planes.filter(p => p.recurrente && p.fecha).map(p => {
    let f = t.slice(0, 4) + '-' + p.fecha.slice(5);
    if (f < t) f = (+t.slice(0, 4) + 1) + '-' + p.fecha.slice(5);
    return { p, f };
  }).sort((a, b) => a.f.localeCompare(b.f))[0];
}

function recuerdos() {
  const r = [];
  S.planes.forEach(p => {
    if (p.recurrente) p.historial.forEach(h => r.push({ titulo: p.nombre + ' ' + h.fecha.slice(0, 4), fecha: h.fecha, fotos: h.fotos, id: p.id, icono: ico('planes', p) }));
    else if (p.estado === 'hecho' && p.hechoEn) r.push({ titulo: p.nombre, fecha: p.hechoEn, fotos: p.fotos, id: p.id, icono: ico('planes', p) });
  });
  return r.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

// Todo lo que pasa en un día: planes hechos, planeados y fechas especiales (cada año)
function planesDelDia(f) {
  const r = [];
  S.planes.forEach(p => {
    if (p.recurrente) {
      const h = p.historial.find(x => x.fecha === f);
      if (h) r.push({ p, tipo: 'hecho', fotos: h.fotos });
      else if (p.fecha && p.fecha.slice(5) === f.slice(5)) r.push({ p, tipo: 'fecha', fotos: [] });
    } else if (p.estado === 'hecho' && p.hechoEn === f) r.push({ p, tipo: 'hecho', fotos: p.fotos });
    else if (p.estado !== 'hecho' && p.fecha === f) r.push({ p, tipo: 'planeado', fotos: [] });
  });
  return r;
}
const TIPO_TXT = { hecho: '✅ Hecho', planeado: '📅 Planeado', fecha: '🎉 Fecha especial' };

function vPlanes() {
  const s = ui.sub.planes;
  let h = seg('planes', [['tablero', '📋 Tablero'], ['cal', '📅 Calendario'], ['recuerdos', '📸 Recuerdos'], ['fechas', '🎉 Fechas']]);
  const norm = S.planes.filter(p => !p.recurrente);

  if (s === 'tablero') {
    h += [['idea', '💭 Ideas'], ['planeado', '📅 Planeados'], ['hecho', '✅ Hechos']].map(([e, l]) => {
      const ps = norm.filter(p => p.estado === e);
      return `<h2>${l} (${ps.length})</h2><div class="card">${ps.map(p => `<div class="item" onclick="verPlan('${p.id}')"><div><b><span class="emo">${ico('planes', p)}</span>${esc(p.nombre)}</b><div class="mut">${p.estado === 'hecho' ? fechaTxt(p.hechoEn) : p.fecha ? fechaTxt(p.fecha) : esc(p.desc)}</div></div>${p.fotos.length ? '<span class="mut">📷 ' + p.fotos.length + '</span>' : ''}</div>`).join('') || '<p class="mut">Vacío</p>'}</div>`;
    }).join('');
    h += `<div class="card"><b>${norm.filter(p => p.estado === 'hecho' && p.hechoEn && p.hechoEn.startsWith(today().slice(0, 4))).length}</b> planes hechos este año 🎉</div>`;
  }

  if (s === 'cal') {
    const m = S.month, sel = selDia('planes', m), ps = planesDelDia(sel);
    h += mesSel() + `<div class="card">${calGrid('planes', m, f => {
      const d = planesDelDia(f);
      return d.length ? `<span class="ee">${d.slice(0, 3).map(x => `<span class="${x.tipo === 'hecho' ? '' : 'fade'}">${ico('planes', x.p)}</span>`).join('')}</span>` : '';
    })}<div class="mut" style="margin-top:8px">Ícono fuerte = plan hecho · apagado = planeado o fecha especial</div></div>
    <div class="card"><div class="row"><h3>${fechaTxt(sel)}${sel === today() ? ' · hoy' : ''}</h3><button class="btn sm" onclick="formPlan(null,false,'${sel}')">＋ Plan</button></div>
    ${ps.map(x => `<div class="item" onclick="verPlan('${x.p.id}')"><div><b><span class="emo">${ico('planes', x.p)}</span>${esc(x.p.nombre)}</b><div class="mut">${TIPO_TXT[x.tipo]}</div></div>${x.fotos.length ? `<span class="mut">📷 ${x.fotos.length}</span>` : ''}</div>`).join('') || '<p class="mut">Sin planes este día.</p>'}</div>`;
  }

  if (s === 'recuerdos') {
    const r = recuerdos();
    h += r.length ? `<div class="grid2">${r.map(x => {
      const ya = +today().slice(0, 4) - +x.fecha.slice(0, 4);
      return `<div class="pol" onclick="verPlan('${x.id}')">${x.fotos[0] ? `<img src="${Photos.src(x.fotos[0])}">` : `<div class="ph">${x.icono}</div>`}<p><b>${x.icono} ${esc(x.titulo)}</b></p><p>${fechaTxt(x.fecha)}${ya > 0 ? ' · hace ' + ya + (ya > 1 ? ' años' : ' año') : ''}</p></div>`;
    }).join('')}</div>` : '<div class="card"><p>Aquí aparecerán sus recuerdos 📸. Marca un plan como hecho y agrega una foto.</p></div>';
  }

  if (s === 'fechas') {
    h += `<div class="card">${S.planes.filter(p => p.recurrente).map(p => {
      let tx = 'Definir fecha';
      if (p.fecha) { const t = today(); let f = t.slice(0, 4) + '-' + p.fecha.slice(5); if (f < t) f = (+t.slice(0, 4) + 1) + '-' + p.fecha.slice(5); tx = fechaTxt(f) + ' · ' + diffDays(f, t) + ' días'; }
      return `<div class="item" onclick="verPlan('${p.id}')"><div><b><span class="emo">${ico('planes', p)}</span>${esc(p.nombre)}</b><div class="mut">${tx}</div></div><span class="mut">${p.historial.length} año${p.historial.length === 1 ? '' : 's'} ›</span></div>`;
    }).join('')}</div><button class="btn sec" onclick="formPlan(null,true)">＋ Nueva fecha recurrente</button>`;
  }
  return h;
}

// fechaPre: fecha sugerida al crear desde el calendario (si ya pasó, queda como "Hecho")
function formPlan(id, rec, fechaPre) {
  const p = S.planes.find(x => x.id === id) || { nombre: '', desc: '', estado: fechaPre ? (fechaPre <= today() ? 'hecho' : 'planeado') : rec ? 'planeado' : 'idea', fecha: fechaPre || '', recurrente: !!rec, icono: rec ? '🎉' : '💞' };
  openSheet(`<h2>${id ? 'Editar plan' : 'Nuevo plan'}</h2>
  <label>Ícono</label>${emojiPicker('pl_i', 'planes', ico('planes', p))}
  <label>Nombre<input id="pl_n" value="${esc(p.nombre)}"></label>
  <label>Descripción (opcional)<textarea id="pl_d" rows="2">${esc(p.desc)}</textarea></label>
  <label>Estado<select id="pl_e">${[['idea', '💭 Idea'], ['planeado', '📅 Planeado'], ['hecho', '✅ Hecho']].map(([k, l]) => `<option value="${k}" ${p.estado === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
  <label>Fecha<input id="pl_f" type="date" value="${p.fecha || ''}"></label>
  <label class="chk"><input id="pl_r" type="checkbox" ${p.recurrente ? 'checked' : ''}>Se repite cada año 🔁</label><div id="err" class="err"></div><br>
  <div class="row"><button class="btn" onclick="savePlan('${id || ''}')">Guardar</button>${id ? `<button class="btn bad" onclick="delPlan('${id}')">Eliminar</button>` : ''}</div>`);
}

function savePlan(id) {
  const n = $('#pl_n').value.trim();
  if (!n) return $('#err').textContent = 'Escribe un nombre';
  const rec = $('#pl_r').checked, est = $('#pl_e').value, fecha = $('#pl_f').value;
  const base = S.planes.find(x => x.id === id);
  const o = { nombre: n, desc: $('#pl_d').value, estado: rec && est === 'hecho' ? 'planeado' : est, fecha, recurrente: rec, icono: $('#pl_i').value || '💞' };
  if (!rec && est === 'hecho' && !(base && base.hechoEn)) o.hechoEn = fecha || today();
  if (id) Data.upd('planes', id, o); else Data.add('planes', { ...o, hechoEn: o.hechoEn || '', fotos: [], historial: [] });
  if (o.hechoEn) { ui.dia.planes = o.hechoEn; S.month = o.hechoEn.slice(0, 7); } else if (fecha) { ui.dia.planes = fecha; S.month = fecha.slice(0, 7); }
  closeSheet(); render();
}
function delPlan(id) { if (confirm('¿Eliminar este plan y sus fotos?')) { Data.del('planes', id); closeSheet(); render(); } }

function verPlan(id) {
  const p = S.planes.find(x => x.id === id); if (!p) return;
  const fotos = a => a.length ? `<div class="ph2">${a.map(f => `<img src="${Photos.src(f)}">`).join('')}</div>` : '';
  openSheet(`<h2><span class="emo">${ico('planes', p)}</span>${esc(p.nombre)}</h2><div class="mut">${p.recurrente ? 'Se repite cada año 🔁' + (p.fecha ? ' · ' + fechaTxt(p.fecha).slice(0, -5) : '') : p.estado}</div><p>${esc(p.desc)}</p>
  ${p.recurrente ? [...p.historial].sort((a, b) => b.fecha.localeCompare(a.fecha)).map(h => `<h3>${h.fecha.slice(0, 4)} · ${fechaTxt(h.fecha)}</h3>${fotos(h.fotos)}`).join('') : fotos(p.fotos) + (p.estado === 'hecho' ? `<p class="mut">Hecho el ${fechaTxt(p.hechoEn)}</p>` : '')}
  <div class="grid2" style="margin-top:12px">${p.estado !== 'hecho' || p.recurrente ? `<button class="btn" onclick="hechoSheet('${id}')">${p.recurrente ? '📸 Registrar este año' : '✅ Marcar como hecho'}</button>` : `<button class="btn sec" onclick="fotosSheet('${id}')">📷 Agregar fotos</button>`}<button class="btn sec" onclick="formPlan('${id}')">✏️ Editar</button></div>`);
}

function hechoSheet(id) {
  openSheet(`<h2>🎉 ¡Plan cumplido!</h2><label>Fecha<input id="h_f" type="date" value="${today()}"></label><label>Fotos (una o varias)<input id="h_p" type="file" accept="image/*" multiple></label><br><button class="btn" onclick="confirmHecho('${id}')">Guardar recuerdo</button>`);
}
function fotosSheet(id) { openSheet(`<h2>📷 Agregar fotos</h2><label>Fotos<input id="h_p" type="file" accept="image/*" multiple></label><br><button class="btn" onclick="addFotos('${id}')">Agregar</button>`); }

async function confirmHecho(id) {
  const f = $('#h_f').value || today();
  let fotos = [];
  try { fotos = await Photos.add($('#h_p').files); } catch (e) { return toast('No se pudieron subir las fotos: ' + (e.message || e)); }
  const p = S.planes.find(x => x.id === id);
  if (p.recurrente) {
    const ex = p.historial.find(h => h.fecha.slice(0, 4) === f.slice(0, 4));
    if (ex) Data.delHist(id, ex.id);
    Data.addHist(id, { fecha: f, fotos });
  } else Data.upd('planes', id, { estado: 'hecho', hechoEn: f, fotos: [...p.fotos, ...fotos] });
  closeSheet(); ui.sub.planes = 'recuerdos'; ui.dia.planes = f; S.month = f.slice(0, 7); render();
}
async function addFotos(id) {
  let fotos = [];
  try { fotos = await Photos.add($('#h_p').files); } catch (e) { return toast('No se pudieron subir las fotos: ' + (e.message || e)); }
  const p = S.planes.find(x => x.id === id);
  Data.upd('planes', id, { fotos: [...p.fotos, ...fotos] });
  verPlan(id); render();
}
