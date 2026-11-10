/*
 * Capa de Supabase. Solo aquí se habla con el servidor.
 * Si config.js está vacío, DB.enabled = false y la app usa el modo local.
 * T: clave del estado (S) -> tabla y renombre de campos (campoS: columnaDB)
 */
const DB = {
  client: null, enabled: false, user: null,

  T: {
    cats:      { t: 'categorias_gasto',  f: { n: 'nombre', t: 'tipo' }, order: 'created_at' },
    gastos:    { t: 'gastos',            f: { cat: 'categoria' }, order: 'created_at' },
    ahorros:   { t: 'ahorros',           f: {}, order: 'created_at' },
    reglas:    { t: 'reglas',            f: { n: 'nombre', q: 'cuota', d: 'ventana_dias' }, order: 'orden' },
    pecados:   { t: 'pecados',           f: { cat: 'regla_id', pen: 'penalizacion' }, order: 'created_at' },
    retos:     { t: 'retos',             f: {}, order: 'created_at' },
    retosPend: { t: 'retos_pendientes',  f: {}, order: 'created_at' },
    planes:    { t: 'planes',            f: { desc: 'descripcion', hechoEn: 'hecho_en' }, skip: ['historial'], order: 'created_at' }
  },

  init() {
    const c = window.CONFIG || {};
    if (c.SUPABASE_URL && c.SUPABASE_ANON_KEY && window.supabase) {
      this.client = window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_ANON_KEY);
      this.enabled = true;
    }
  },

  from(t) { return this.client.from(t); },

  toRow(key, o) {
    const m = this.T[key], r = {};
    for (const k in o) {
      if (m.skip && m.skip.includes(k)) continue;
      r[m.f[k] || k] = o[k] === '' ? null : o[k];
    }
    return r;
  },

  fromRow(key, row) {
    const m = this.T[key], inv = {}, o = {};
    for (const k in m.f) inv[m.f[k]] = k;
    for (const c in row) { if (c === 'created_at' || c === 'created_by' || c === 'orden') continue; o[inv[c] || c] = row[c] == null ? '' : row[c]; }
    if (key === 'planes') { o.historial = []; o.fotos = row.fotos || []; }
    return o;
  },

  async pull(key) {
    const m = this.T[key];
    const { data, error } = await this.from(m.t).select('*').order(m.order, { ascending: true });
    if (error) throw error;
    return data.map(r => this.fromRow(key, r));
  },

  async pullAll() {
    const keys = Object.keys(this.T);
    const res = await Promise.all(keys.map(k => this.pull(k)));
    keys.forEach((k, i) => { S[k] = res[i]; });
    const pr = await this.from('presupuestos').select('*');
    if (pr.error) throw pr.error;
    S.presu = {};
    pr.data.forEach(r => { (S.presu[r.mes] = S.presu[r.mes] || {})[r.categoria] = +r.valor; });
    const hs = await this.from('plan_historial').select('*').order('fecha');
    if (hs.error) throw hs.error;
    S.planes.forEach(p => { p.historial = hs.data.filter(h => h.plan_id === p.id).map(h => ({ id: h.id, fecha: h.fecha, fotos: h.fotos || [] })); });
  },

  async insert(key, o) { const { error } = await this.from(this.T[key].t).insert(this.toRow(key, o)); if (error) throw error; },
  async update(key, id, patch) { const { error } = await this.from(this.T[key].t).update(this.toRow(key, patch)).eq('id', id); if (error) throw error; },
  async remove(key, id) { const { error } = await this.from(this.T[key].t).delete().eq('id', id); if (error) throw error; },

  async upsertPresu(mes, categoria, valor) {
    const { error } = await this.from('presupuestos').upsert({ mes, categoria, valor }, { onConflict: 'mes,categoria' });
    if (error) throw error;
  },
  // Renombra la categoría y mueve sus gastos y presupuestos al nombre nuevo
  async renameCategoria(id, viejo, nuevo) {
    const a = await this.from('categorias_gasto').update({ nombre: nuevo }).eq('id', id); if (a.error) throw a.error;
    const b = await this.from('gastos').update({ categoria: nuevo }).eq('categoria', viejo); if (b.error) throw b.error;
    const c = await this.from('presupuestos').update({ categoria: nuevo }).eq('categoria', viejo); if (c.error) throw c.error;
  },
  async insertHist(h) { const { error } = await this.from('plan_historial').insert(h); if (error) throw error; },
  async removeHist(id) { const { error } = await this.from('plan_historial').delete().eq('id', id); if (error) throw error; },
  async setTheme(tema) { const { error } = await this.from('profiles').update({ tema }).eq('id', this.user.id); if (error) throw error; },

  subscribe(cb) {
    this.client.channel('cambios').on('postgres_changes', { event: '*', schema: 'public' }, cb).subscribe();
  }
};
