/* AJUSTES: persona (solo modo local), tema, copia de seguridad, cerrar sesión */

function ajustes() {
  openSheet(`<h2>Ajustes</h2>
  ${DB.enabled ? `<p>Sesión de <b>${S.me}</b></p>` : `<label>Soy (modo local)</label><div class="seg">${PEOPLE.map(p => `<button class="${S.me === p ? 'on' : ''}" onclick="S.me='${p}';Data.savePrefs();render();ajustes()">${p}</button>`).join('')}</div>`}
  <label>Tema de ${S.me}</label><div class="seg">
    <button class="${S.themes[S.me] === 'dark' ? 'on' : ''}" onclick="Data.setTheme('dark');render();ajustes()">Oscuro</button>
    <button class="${S.themes[S.me] === 'pastel' ? 'on' : ''}" onclick="Data.setTheme('pastel');render();ajustes()">Claro pastel</button></div>
  <div class="note">Cada persona guarda su propio tema. No cambia con el modo del celular.</div>
  <button class="btn sec" style="width:100%;margin-bottom:8px" onclick="exportar()">Descargar copia de seguridad</button>
  ${DB.enabled
    ? '<button class="btn bad" style="width:100%" onclick="Auth.logout()">Cerrar sesión</button>'
    : '<button class="btn bad" style="width:100%" onclick="if(confirm(\'¿Restablecer todo a los datos de ejemplo?\')){Data.resetDemo();closeSheet();render()}">Restablecer datos de ejemplo</button>'}`);
}

function exportar() {
  const d = Object.fromEntries(DATA_KEYS.map(k => [k, S[k]]));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }));
  a.download = 'paul-y-luisa-' + today() + '.json';
  a.click();
}
