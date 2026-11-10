/* Arranque, navegación y render principal */
// ui: pestaña actual, sub-pestañas, y día seleccionado en cada calendario
const ui = { tab: 'inicio', sub: { gastos: 'resumen', comida: 'panel', planes: 'tablero' }, dia: { comida: null, planes: null } };

function go(t) { ui.tab = t; render(); }

function agregar() {
  if (ui.tab === 'gastos') return formGasto();
  if (ui.tab === 'comida') return formPecado();
  if (ui.tab === 'planes') return formPlan();
  openSheet(`<h2>¿Qué quieres agregar?</h2><div class="grid2"><button class="btn" onclick="formGasto()">🧾 Gasto</button><button class="btn" onclick="formPecado()">🍽️ Comida</button></div><br><button class="btn sec" style="width:100%" onclick="formPlan()">💞 Plan</button>`);
}

function render() {
  document.body.dataset.theme = S.themes[S.me];
  const titulos = { inicio: '👋 Hola, ' + S.me, gastos: '🧾 Gastos de la casa', comida: '🍽️ Comida', planes: '💞 Planes' };
  $('#top').innerHTML = `<div><h1>${titulos[ui.tab]}</h1><div class="mut">${fechaTxt(today())}</div></div><button class="av" style="background:${pc(S.me)}" onclick="ajustes()" aria-label="Ajustes">${S.me[0]}</button>`;
  const nb = (t, l) => `<button class="nb ${ui.tab === t ? 'on' : ''}" onclick="go('${t}')"><svg viewBox="0 0 24 24">${ICON[t]}</svg>${l}</button>`;
  $('#nav').innerHTML = nb('inicio', 'Inicio') + nb('gastos', 'Gastos') + `<button class="plus" onclick="agregar()" aria-label="Agregar"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>` + nb('comida', 'Comida') + nb('planes', 'Planes');
  $('#main').innerHTML = { inicio: vInicio, gastos: vGastos, comida: vComida, planes: vPlanes }[ui.tab]();
}

async function boot() {
  DB.init();
  Data.loadPrefs();
  if (!DB.enabled) {
    if (!Data.loadLocal()) Data.resetDemo();
    return render();
  }
  const { data } = await DB.client.auth.getSession();
  if (!data.session) return Auth.showLogin();
  await Auth.afterLogin();
}

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
boot();
