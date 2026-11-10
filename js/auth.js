/*
 * Inicio de sesión (solo modo Supabase). Los dos usuarios se crean a mano en
 * Supabase → Authentication → Users, y se enlazan en la tabla profiles (ver supabase/seed.sql).
 */
const Auth = {
  showLogin(msg) {
    document.body.dataset.theme = 'dark';
    document.body.classList.add('sin-nav');
    $('#top').innerHTML = '';
    $('#main').innerHTML = `<div class="login card"><h1>PaLu</h1><p class="mut">Inicia sesión para continuar</p>
      <label>Correo<input id="l_e" type="email" autocomplete="username"></label>
      <label>Contraseña<input id="l_p" type="password" autocomplete="current-password"></label>
      <div class="err" id="l_err">${esc(msg || '')}</div><br>
      <button class="btn" style="width:100%" onclick="Auth.login()">Entrar</button></div>`;
  },

  async login() {
    const email = $('#l_e').value.trim(), password = $('#l_p').value;
    if (!email || !password) return $('#l_err').textContent = 'Escribe tu correo y contraseña';
    const { error } = await DB.client.auth.signInWithPassword({ email, password });
    if (error) return $('#l_err').textContent = 'Correo o contraseña incorrectos';
    await this.afterLogin();
  },

  async afterLogin() {
    const { data: { user } } = await DB.client.auth.getUser();
    DB.user = user;
    const { data: prof } = await DB.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (!prof) { await DB.client.auth.signOut(); return this.showLogin('Tu usuario aún no está habilitado en la app.'); }
    S.me = prof.nombre; S.themes[S.me] = prof.tema; Data.savePrefs();
    document.body.classList.remove('sin-nav');
    try { await Data.refresh(); } catch (e) { toast('No se pudieron cargar los datos: ' + e.message); }
    let t; DB.subscribe(() => { clearTimeout(t); t = setTimeout(async () => { try { await Data.refresh(); render(); } catch (e) {} }, 500); });
    render();
  },

  async logout() {
    await DB.client.auth.signOut();
    location.reload();
  }
};
