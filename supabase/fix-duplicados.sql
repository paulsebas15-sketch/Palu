-- ============================================================
-- Arreglo de duplicados (categorías, retos y fechas recurrentes repetidas
-- por haber ejecutado seed.sql más de una vez).
-- Ejecutar por PASOS en Supabase → SQL Editor. No toca gastos, ahorros,
-- comidas ni presupuestos (se enlazan por nombre, no por el id de la categoría).
-- ============================================================

-- PASO 1: ver qué está repetido (no cambia nada)
select 'categorias' as tabla, nombre as valor, count(*) as veces from categorias_gasto group by nombre having count(*) > 1
union all
select 'retos', texto, count(*) from retos group by texto having count(*) > 1
union all
select 'planes recurrentes', nombre, count(*) from planes where recurrente group by nombre having count(*) > 1;

-- PASO 2: borrar categorías repetidas (se conserva la más antigua de cada nombre)
delete from categorias_gasto where id in (
  select id from (
    select id, row_number() over (partition by nombre order by created_at, id) as rn from categorias_gasto
  ) t where rn > 1
);

-- PASO 3: borrar retos repetidos (se conserva el más antiguo)
delete from retos where id in (
  select id from (
    select id, row_number() over (partition by texto order by created_at, id) as rn from retos
  ) t where rn > 1
);

-- PASO 4: borrar fechas recurrentes repetidas. Se conserva la que tenga más datos:
-- primero la que tenga fecha puesta, luego la que tenga historial o fotos, luego la más antigua.
delete from planes where id in (
  select id from (
    select p.id, row_number() over (
      partition by p.nombre
      order by (p.fecha is not null) desc,
               (select count(*) from plan_historial h where h.plan_id = p.id) desc,
               cardinality(p.fotos) desc, p.created_at, p.id
    ) as rn
    from planes p where p.recurrente
  ) t where rn > 1
);

-- PASO 5: evitar que vuelva a pasar
alter table categorias_gasto add constraint categorias_gasto_nombre_key unique (nombre);
alter table retos add constraint retos_texto_key unique (texto);

-- PASO 6: comprobar (debe salir 8 o 9 categorías, sin repetidas)
select nombre, tipo, icono from categorias_gasto order by tipo, nombre;
