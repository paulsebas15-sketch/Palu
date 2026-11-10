/*
 * Datos por defecto: reglas de comida, categorías de gasto, retos, fechas recurrentes e íconos.
 * (Las mismas se insertan en Supabase con supabase/seed.sql)
 */
const DEFAULTS = {
  // Íconos por defecto (se buscan por id o nombre). Si una categoría/plan nuevo no tiene, se usa el FALLBACK.
  iconos: {
    reglas: { rp: '🍔', po: '🍰', pa: '🥐', fr: '🍟', rb: '🍕', ga: '🥤' },
    cats: { 'Arriendo': '🏠', 'Parqueadero': '🚗', 'Internet': '📶', 'Administración': '🏢', 'Crédito hipotecario': '🏦', 'GYM': '🏋️', 'Mercado': '🛒', 'Servicios públicos': '💡', 'Gas': '🔥', 'Restaurantes': '🍽️' },
    planes: { 'Aniversario de noviazgo': '💍', 'Cumpleaños de Paul': '🎂', 'Cumpleaños de Luisa': '🎂', 'Navidad': '🎄', 'Halloween': '🎃' }
  },

  cats: () => [
    ['Arriendo', 'fija'], ['Parqueadero', 'fija'], ['Internet', 'fija'], ['Administración', 'fija'], ['Crédito hipotecario', 'fija'], ['GYM', 'fija'],
    ['Mercado', 'variable'], ['Servicios públicos', 'variable'], ['Gas', 'variable'], ['Restaurantes', 'variable']
  ].map(([n, t]) => ({ id: uid(), n, t, icono: DEFAULTS.iconos.cats[n] })),

  // q = veces permitidas, d = ventana móvil en días
  reglas: () => [
    { id: 'rp', n: 'Comida rápida con proteína', q: 1, d: 3, icono: '🍔' },
    { id: 'po', n: 'Postre', q: 1, d: 3, icono: '🍰' },
    { id: 'pa', n: 'Panadería', q: 1, d: 15, icono: '🥐' },
    { id: 'fr', n: 'Fritos', q: 1, d: 15, icono: '🍟' },
    { id: 'rb', n: 'Comida rápida con poca proteína', q: 1, d: 30, icono: '🍕' },
    { id: 'ga', n: 'Gaseosa', q: 1, d: 30, icono: '🥤' }
  ],

  retos: () => ['Caminata de 30 minutos', 'Cocinar una comida sana en casa', 'Un día sin dulce', 'Ensalada completa en la cena']
    .map(texto => ({ id: uid(), texto })),

  recurrentes: () => [
    ['Aniversario de noviazgo', ''], ['Cumpleaños de Paul', ''], ['Cumpleaños de Luisa', ''],
    ['Navidad', '2026-12-25'], ['Halloween', '2026-10-31']
  ].map(([nombre, fecha]) => ({ id: uid(), nombre, desc: '', estado: 'planeado', fecha, recurrente: true, hechoEn: '', fotos: [], historial: [], icono: DEFAULTS.iconos.planes[nombre] })),

  // Datos de ejemplo solo para el MODO LOCAL
  demo() {
    const m = periodoActual(), ini = periodoRango(m).desde; // gastos de ejemplo dentro del periodo actual
    return {
      cats: this.cats(), reglas: this.reglas(), retos: this.retos(), retosPend: [],
      gastos: [
        { id: uid(), fecha: addDays(ini, 3), periodo: m, cat: 'Mercado', valor: 150000, quien: 'Paul', nota: 'Ejemplo' },
        { id: uid(), fecha: addDays(ini, 4), periodo: m, cat: 'Servicios públicos', valor: 100000, quien: 'Luisa', nota: 'Ejemplo' },
        { id: uid(), fecha: addDays(ini, 5), periodo: m, cat: 'Arriendo', valor: 100000, quien: 'Luisa', nota: 'Ejemplo' }
      ],
      presu: { [m]: { 'Arriendo': 100000, 'Mercado': 200000, 'Servicios públicos': 100000 } },
      ahorros: [],
      pecados: [
        { id: uid(), fecha: addDays(today(), -1), cat: 'po', quien: 'Paul', nota: 'Helado de vainilla', pen: '' },
        { id: uid(), fecha: addDays(today(), -2), cat: 'po', quien: 'Luisa', nota: 'Brownie', pen: '' },
        { id: uid(), fecha: addDays(today(), -5), cat: 'pa', quien: 'Juntos', nota: 'Pan de bono con café', pen: '' }
      ],
      planes: [...this.recurrentes(), { id: uid(), nombre: 'Picnic en el parque', desc: 'Idea de ejemplo', estado: 'idea', fecha: '', recurrente: false, hechoEn: '', fotos: [], historial: [], icono: '🧺' }]
    };
  }
};

// Ícono de un objeto: el guardado, o el de DEFAULTS, o uno genérico
const ICO_FALLBACK = { reglas: '🍽️', cats: '🧾', planes: '💞' };
const ico = (kind, o) => { o = o || {}; return o.icono || DEFAULTS.iconos[kind][o.id] || DEFAULTS.iconos[kind][o.n] || DEFAULTS.iconos[kind][o.nombre] || ICO_FALLBACK[kind]; };
