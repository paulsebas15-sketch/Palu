/* Pantalla INICIO: resumen de las tres secciones */

// Para cada regla de comida: ¿quién puede comerla hoy?
function disponibleHoy() {
  return S.reglas.map(r => {
    const es = PEOPLE.map(p => ({ p, e: estadoEn(r, p, today()) }));
    const libres = es.filter(x => x.e.libres > 0).map(x => x.p);
    return { r, libres, dias: Math.min(...es.map(x => x.e.dias || 99)) };
  });
}

function vInicio() {
  const m = periodoActual(), t = totales(m);
  const balance = t.menos ? `<span class="chip" style="color:${pc(t.menos)}">${t.menos} aportó menos</span> saldo pendiente <b>${money(t.pend)}</b>` : 'Van parejos este mes';
  const sig = proximaFecha();
  const rec = recuerdos();
  const viejo = rec.find(x => x.fecha.slice(0, 4) < today().slice(0, 4) && x.fecha.slice(5, 7) === today().slice(5, 7)) || rec[0];
  const tiles = disponibleHoy().map(({ r, libres, dias }) => {
    const cls = libres.length === 2 ? 'ok' : libres.length === 1 ? 'mid' : 'no';
    const txt = libres.length === 2 ? 'Los dos' : libres.length === 1 ? libres[0] : 'en ' + dias + ' d';
    return `<div class="tile ${cls}"><b>${ico('reglas', r)}</b>${txt}</div>`;
  }).join('');
  return `<div class="card"><div class="mut">💰 Gastos de ${mesNombre(m)} (${periodoTxt(m)})</div><div class="big">${money(t.tot)}</div><div class="mut">${balance}</div></div>
  <div class="card"><div class="mut">🐷 Ahorro acumulado</div><div class="big" style="font-size:22px">${money(ahorroTotal())}</div></div>
  <div class="card"><div class="mut">🍽️ ¿Qué podemos comer hoy?</div><div class="tiles">${tiles}</div><div class="mut" style="margin-top:8px">Verde: los dos · Amarillo: solo uno · Apagado: nadie (faltan días)</div></div>
  <div class="card"><div class="mut">🎉 Próxima fecha especial</div>${sig ? `<h3><span class="emo">${ico('planes', sig.p)}</span>${esc(sig.p.nombre)}</h3><div class="mut">${fechaTxt(sig.f)} · faltan ${diffDays(sig.f, today())} días</div>` : '<div>Agrega fechas en Planes → Fechas</div>'}</div>
  <div class="card"><div class="mut">📸 Recuerdo</div>${viejo ? `<h3><span class="emo">${viejo.icono}</span>${esc(viejo.titulo)}</h3><div class="mut">${fechaTxt(viejo.fecha)}</div>${viejo.fotos[0] ? `<div class="ph2"><img src="${Photos.src(viejo.fotos[0])}"></div>` : ''}` : '<div>Aún no hay planes cumplidos. ¡Hagan el primero!</div>'}</div>
  ${DB.enabled ? '' : '<div class="note">Modo local: los datos se guardan solo en este navegador. Para sincronizar los dos celulares, configura Supabase en js/config.js.</div>'}`;
}
