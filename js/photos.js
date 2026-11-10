/*
 * Fotos. Modo local: se guardan como imagen reducida (dataURL).
 * Modo Supabase: se suben al bucket privado "fotos" y se guarda la ruta; se muestran con URLs firmadas.
 */
const Photos = {
  _img(file, max, q, asBlob) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onerror = rej;
      r.onload = () => {
        const im = new Image();
        im.onerror = rej;
        im.onload = () => {
          const k = Math.min(1, max / Math.max(im.width, im.height));
          const c = document.createElement('canvas');
          c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          asBlob ? c.toBlob(b => res(b), 'image/jpeg', q) : res(c.toDataURL('image/jpeg', q));
        };
        im.src = r.result;
      };
      r.readAsDataURL(file);
    });
  },

  async add(files) {
    const out = [];
    for (const f of files) {
      if (DB.enabled) {
        const blob = await this._img(f, 1280, .8, true);
        const path = uid() + '.jpg';
        const { error } = await DB.client.storage.from('fotos').upload(path, blob, { contentType: 'image/jpeg' });
        if (error) throw error;
        out.push(path);
      } else out.push(await this._img(f, 700, .7, false));
    }
    if (DB.enabled) await this.resolve(out);
    return out;
  },

  src(x) { return !x ? '' : x.startsWith('data:') ? x : (S._urls[x] || ''); },

  async resolve(paths) {
    if (!DB.enabled) return;
    const need = [...new Set(paths)].filter(p => p && !p.startsWith('data:') && !S._urls[p]);
    if (!need.length) return;
    const { data } = await DB.client.storage.from('fotos').createSignedUrls(need, 86400);
    (data || []).forEach(d => { if (d.signedUrl) S._urls[d.path] = d.signedUrl; });
  },

  allPaths() { return S.planes.flatMap(p => [...p.fotos, ...p.historial.flatMap(h => h.fotos)]); }
};
