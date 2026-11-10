/*
 * Configuración de Supabase.
 * Si se dejan vacíos, la app funciona en MODO LOCAL (datos solo en este navegador).
 * Se llenan con los valores de Supabase → Project Settings → API:
 *   SUPABASE_URL      = "Project URL"
 *   SUPABASE_ANON_KEY = clave "publishable" (o "anon public"). Es segura para el código.
 * NUNCA pongas aquí la clave "service_role" ni la "secret".
 */
window.CONFIG = {
  SUPABASE_URL: 'https://vhrpcnxeuvxqlsewqlmo.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_QzZwZYyaxANqRFh1Tz8NgQ_foouiWzu'
};
