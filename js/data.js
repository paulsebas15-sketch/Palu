/*
 * Estado de la app (S) y operaciones de datos.
 * Las vistas SOLO usan Data.add / upd / del (nunca tocan DB directamente).
 * Modo local: guarda en localStorage. Modo Supabase: guarda optimista y sincroniza.
 */
const DATA_KEYS = ['cats', 'gastos', 'presu', 'ahorros', 'reglas', 'pecados', 'retos', 'retosPend', 'planes'];

let S = {
  me: 'Paul', themes: { Paul: 'dark', Luisa: 'pastel' },
  month: today().slice(0, 7),       // mes del calendario (Comida y Planes)
  periodo: periodoActual(),         // periodo de gastos (25 al 24)
  inicio: today(), _urls: {},
  cats: [], gastos: [], presu: {}, ahorros: [], reglas: [], pecados: [], retos: [], retosPend: [], planes: []
};

const Data = {
  loadPrefs() {
    try {
      const p = JSON.parse(localStorage.getItem('pyl_prefs')) || {};
      S.me = p.me || S.me; S.themes = p.themes || S.themes; S.inicio = p.inicio || S.inicio;
    } catch (e) {}
    this.savePrefs();
  },
  savePrefs() { try { localStorage.setItem('pyl_prefs', JSON.stringify({ me: S.me, themes: S.themes, inicio: S.inicio })); } catch (e) {} },

  loadLocal() {
    try {
      const d = JSON.parse(localStorage.getItem('pyl_data'));
      if (!d) return false;
      // Migración v2: Comida rápida con proteína y Postre pasan a 1 cada 3 días
      if ((d._v || 1) < 2 && d.reglas) d.reglas.forEach(r => { if (r.id === 'rp' || r.id === 'po') { r.q = 1; r.d = 3; } });
      // Migración v3: nueva categoría fija GYM
      if ((d._v || 1) < 3 && d.cats && !d.cats.some(c => c.n === 'GYM')) d.cats.push({ id: uid(), n: 'GYM', t: 'fija', icono: '🏋️' });
      DATA_KEYS.forEach(k => { if (d[k]) S[k] = d[k]; });
      return true;
    } catch (e) { return false; }
  },
  saveLocal() {
    if (DB.enabled) return;
    try { localStorage.setItem('pyl_data', JSON.stringify({ ...Object.fromEntries(DATA_KEYS.map(k => [k, S[k]])), _v: 3 })); }
    catch (e) { toast('No hay espacio para guardar en este dispositivo'); }
  },
  resetDemo() { Object.assign(S, DEFAULTS.demo()); this.saveLocal(); },

  _sync(fn) {
    if (!DB.enabled) return;
    fn().catch(e => { console.error(e); toast('No se pudo sincronizar: ' + (e.message || e)); });
  },

  add(key, o) { o.id = o.id || uid(); S[key].push(o); this.saveLocal(); this._sync(() => DB.insert(key, o)); return o; },
  upd(key, id, patch) { const o = S[key].find(x => x.id === id); if (!o) return; Object.assign(o, patch); this.saveLocal(); this._sync(() => DB.update(key, id, patch)); },
  del(key, id) { S[key] = S[key].filter(x => x.id !== id); this.saveLocal(); this._sync(() => DB.remove(key, id)); },

  setPresu(mes, cat, v) { (S.presu[mes] = S.presu[mes] || {})[cat] = v; this.saveLocal(); this._sync(() => DB.upsertPresu(mes, cat, v)); },

  addHist(planId, h) {
    h.id = h.id || uid();
    S.planes.find(p => p.id === planId).historial.push(h);
    this.saveLocal(); this._sync(() => DB.insertHist({ id: h.id, plan_id: planId, fecha: h.fecha, fotos: h.fotos }));
  },
  delHist(planId, hid) {
    const p = S.planes.find(x => x.id === planId); p.historial = p.historial.filter(h => h.id !== hid);
    this.saveLocal(); this._sync(() => DB.removeHist(hid));
  },

  setTheme(t) { S.themes[S.me] = t; this.savePrefs(); this._sync(() => DB.setTheme(t)); },

  async refresh() { await DB.pullAll(); await Photos.resolve(Photos.allPaths()); }
};
