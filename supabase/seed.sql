-- ============================================================
-- Datos iniciales. Ejecutar DESPUÉS de schema.sql.
-- ============================================================

-- Reglas de comida (cuota = veces permitidas, ventana = días móviles)
insert into reglas (id, nombre, cuota, ventana_dias, icono, orden) values
  ('rp', 'Comida rápida con proteína',       1,  3, '🍔', 1),
  ('po', 'Postre',                           1,  3, '🍰', 2),
  ('pa', 'Panadería',                        1, 15, '🥐', 3),
  ('fr', 'Fritos',                           1, 15, '🍟', 4),
  ('rb', 'Comida rápida con poca proteína',  1, 30, '🍕', 5),
  ('ga', 'Gaseosa',                          1, 30, '🥤', 6)
on conflict (id) do nothing;

-- Categorías de gasto
insert into categorias_gasto (nombre, tipo, icono) values
  ('Arriendo','fija','🏠'), ('Parqueadero','fija','🚗'), ('Internet','fija','📶'), ('Administración','fija','🏢'), ('Crédito hipotecario','fija','🏦'), ('GYM','fija','🏋️'),
  ('Mercado','variable','🛒'), ('Servicios públicos','variable','💡'), ('Gas','variable','🔥')
on conflict (nombre) do nothing;

-- Retos compensatorios
insert into retos (texto) values
  ('Caminata de 30 minutos'), ('Cocinar una comida sana en casa'), ('Un día sin dulce'), ('Ensalada completa en la cena')
on conflict (texto) do nothing;

-- Fechas recurrentes (edita las fechas en la app: Planes → Fechas)
insert into planes (nombre, estado, fecha, recurrente, icono)
select v.nombre, v.estado, v.fecha::date, v.recurrente, v.icono
from (values
  ('Aniversario de noviazgo', 'planeado', null,         true, '💍'),
  ('Cumpleaños de Paul',      'planeado', null,         true, '🎂'),
  ('Cumpleaños de Luisa',     'planeado', null,         true, '🎂'),
  ('Navidad',                 'planeado', '2026-12-25', true, '🎄'),
  ('Halloween',               'planeado', '2026-10-31', true, '🎃')
) as v(nombre, estado, fecha, recurrente, icono)
where not exists (select 1 from planes p where p.nombre = v.nombre and p.recurrente);

-- ------------------------------------------------------------
-- PASO MANUAL: habilitar a Paul y a Luisa
-- 1) Crea los dos usuarios en Authentication → Users → Add user (con correo y contraseña)
-- 2) Cambia los correos de abajo por los reales y ejecuta este bloque:
-- ------------------------------------------------------------
-- insert into profiles (id, nombre, tema)
--   select id, 'Paul', 'dark' from auth.users where email = 'CORREO_DE_PAUL@ejemplo.com';
-- insert into profiles (id, nombre, tema)
--   select id, 'Luisa', 'pastel' from auth.users where email = 'CORREO_DE_LUISA@ejemplo.com';
