/* Piezas de interfaz compartidas: hoja modal, aviso, selector de pestañas, selector de mes, íconos */
const ICON = {
  inicio: '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  gastos: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M16 15h2"/>',
  comida: '<circle cx="12" cy="12" r="9"/><path d="M9 9h.01M15 10h.01M10 15h.01M14.5 15.5h.01"/>',
  planes: '<path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>'
};

function openSheet(h) { $('#shin').innerHTML = h; $('#sheet').classList.add('show'); }
function closeSheet() { $('#sheet').classList.remove('show'); }

let _toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.style.display = 'block';
  clearTimeout(_toastT); _toastT = setTimeout(() => { t.style.display = 'none'; }, 4000);
}

// Pestañas internas de una sección: seg('gastos',[['resumen','Resumen'],...])
function seg(tab, opts) {
  return `<div class="seg">${opts.map(([k, l]) => `<button class="${ui.sub[tab] === k ? 'on' : ''}" onclick="ui.sub.${tab}='${k}';render()">${l}</button>`).join('')}</div>`;
}

function mesSel() {
  const cambia = n => `S.month=addMes(S.month,${n});ui.dia.comida=ui.dia.planes=null;render()`;
  return `<div class="row card"><button class="btn sec sm" onclick="${cambia(-1)}">‹</button><b>${mesNombre(S.month)}</b><button class="btn sec sm" onclick="${cambia(1)}">›</button></div>`;
}

// Selector del periodo de gastos (25 al 24). Usa S.periodo, no S.month (que es del calendario)
function periodoSel() {
  return `<div class="row card"><button class="btn sec sm" onclick="S.periodo=addMes(S.periodo,-1);render()">‹</button><div style="text-align:center"><b>${mesNombre(S.periodo)}</b><div class="mut">${periodoTxt(S.periodo)}</div></div><button class="btn sec sm" onclick="S.periodo=addMes(S.periodo,1);render()">›</button></div>`;
}

/* ---- Selector de ícono (emoji) para categorías, reglas y planes ---- */
const uniq = a => [...new Set(a)];
const EMOJIS = {
  // Gastos
  cats: uniq(['🏠', '🏋️', '🍽️', '☕', '🎬', '✈️', '🚗', '📶', '🏢', '🏦', '🛒', '💡', '🔥', '💧', '📱', '🧾', '🐶', '🐱', '🧴', '🩺', '🎓',
    '🧺', '⛽', '🚌', '🚕', '🛵', '🅿️', '🔧', '🧹', '🛋️', '📺', '🎮', '🎁', '👕', '👟', '💊', '🦷', '💇', '📚', '🍺', '🍷', '🥩',
    '🥦', '🍎', '🥖', '🧃', '🛍️', '💰', '🏖️', '🎟️', '🌿', '🧸', '👶', '📦', '🔑', '🛡️', '🧼', '🪴', '🎵', '🏥', '⚽', '💻']),
  // Comidas
  reglas: uniq(['🍔', '🍰', '🥐', '🍟', '🍕', '🥤', '🍫', '🍦', '🍩', '🌭', '🍿', '🍺', '🍪', '🧁', '🥧', '🍮', '🍨', '🍧', '🍬', '🍭',
    '🥓', '🍗', '🍖', '🌮', '🌯', '🥪', '🥙', '🍝', '🍜', '🍣', '🍤', '🥟', '🍷', '🥂', '🧋', '🥛', '🍞', '🧀', '🍳', '🥞', '🍯', '🍹', '🍸', '☕']),
  // Planes
  planes: uniq(['💍', '🎂', '🎄', '🎃', '🎬', '🍽️', '🏖️', '🏔️', '🎉', '✈️', '🧺', '🎮', '🎵', '🛍️', '🎁', '💞', '🚲', '☕', '🎢', '🌅',
    '🍿', '🎭', '🎤', '🎳', '🏊', '⛷️', '🏕️', '🚗', '🚂', '⛵', '🍷', '🍕', '🍰', '🎨', '📚', '🧘', '💆', '🛁', '🎡', '🎠', '🎪', '⚽',
    '🏀', '🎾', '🥾', '🌄', '🌇', '🌃', '🎆', '🕯️', '💐', '💝', '💌', '📸', '🎥', '🐶', '🌳', '🌊', '🚤', '🎻', '🎹', '🎲', '🧩', '🏡', '🛶'])
};
// Selector de ícono: toca uno de la lista o escribe/pega cualquier emoji (el teclado del celular tiene miles)
function emojiPicker(id, kind, actual) {
  return `<input id="${id}" class="emo-in" maxlength="8" value="${actual || ''}" placeholder="😀"><div class="emojis">${EMOJIS[kind].map(e => `<button type="button" class="${e === actual ? 'on' : ''}" onclick="pickEmoji('${id}','${e}',this)">${e}</button>`).join('')}</div>`;
}
function pickEmoji(id, e, btn) {
  $('#' + id).value = e;
  btn.parentNode.querySelectorAll('button').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
}

/* ---- Calendario mensual reutilizable (Comida y Planes) ---- */
// Día seleccionado: el que tocaste, o hoy si estás en el mes actual, o el día 1
function selDia(tab, m) {
  const d = ui.dia[tab];
  return d && d.startsWith(m) ? d : (today().startsWith(m) ? today() : m + '-01');
}
// cellFn(fecha) devuelve el HTML de los íconos de ese día
function calGrid(tab, m, cellFn) {
  const first = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1, 1);
  const dias = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(), off = (first.getDay() + 6) % 7, sel = selDia(tab, m);
  return `<div class="cal">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => `<div class="h">${d}</div>`).join('')}${'<div></div>'.repeat(off)}${Array.from({ length: dias }, (_, i) => {
    const f = m + '-' + String(i + 1).padStart(2, '0');
    return `<div class="${f === today() ? 't ' : ''}${f === sel ? 'sel' : ''}" onclick="pickDia('${tab}','${f}')">${i + 1}${cellFn(f)}</div>`;
  }).join('')}</div>`;
}
function pickDia(tab, f) { ui.dia[tab] = f; render(); }
