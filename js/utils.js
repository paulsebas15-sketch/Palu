/* Utilidades generales: fechas, dinero, ids, escape de HTML */
const $ = s => document.querySelector(s);
const iso = d => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return z.toISOString().slice(0, 10); };
const today = () => iso(new Date());
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); };
const diffDays = (a, b) => Math.round((new Date(a + 'T12:00:00') - new Date(b + 'T12:00:00')) / 864e5);
const money = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const mesNombre = m => MESES[+m.slice(5, 7) - 1] + ' ' + m.slice(0, 4);
const addMes = (m, n) => { const d = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1 + n, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
const fechaTxt = s => { if (!s) return ''; const d = new Date(s + 'T12:00:00'); return d.getDate() + ' ' + MESES[d.getMonth()].slice(0, 3).toLowerCase() + ' ' + d.getFullYear(); };
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id' + Math.random().toString(36).slice(2) + Date.now().toString(36));
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const PEOPLE = ['Paul', 'Luisa'];
const pc = p => p === 'Paul' ? 'var(--paul)' : p === 'Luisa' ? 'var(--luisa)' : 'var(--acc)';

/*
 * Periodo de gastos: va del 25 del mes anterior al 24 del mes (ej. "noviembre" = 25 oct – 24 nov).
 * Un gasto desde el día 25 cuenta para el mes siguiente. Se puede cambiar a mano (gastos anticipados).
 */
const DIA_CORTE = 25;
const fechaCorta = s => +s.slice(8, 10) + ' ' + MESES[+s.slice(5, 7) - 1].slice(0, 3).toLowerCase();
const periodoDe = f => { const m = f.slice(0, 7); return +f.slice(8, 10) >= DIA_CORTE ? addMes(m, 1) : m; };
const periodoRango = p => ({ desde: addMes(p, -1) + '-' + DIA_CORTE, hasta: p + '-' + (DIA_CORTE - 1) });
const periodoActual = () => periodoDe(today());
const periodoTxt = p => { const r = periodoRango(p); return fechaCorta(r.desde) + ' – ' + fechaCorta(r.hasta); };
