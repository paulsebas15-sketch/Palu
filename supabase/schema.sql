-- ============================================================
-- Paul y Luisa — esquema de base de datos (Supabase / Postgres)
-- Ejecutar UNA vez en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1) Perfiles: enlazan cada usuario (Auth) con Paul o Luisa. Es también la lista de "miembros".
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  nombre text not null check (nombre in ('Paul','Luisa')),
  tema text not null default 'dark' check (tema in ('dark','pastel')),
  created_at timestamptz default now()
);

create or replace function es_miembro() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid());
$$;

-- 2) Gastos de la casa
create table if not exists categorias_gasto (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  tipo text not null check (tipo in ('fija','variable')),
  icono text,
  created_at timestamptz default now()
);
create table if not exists gastos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  categoria text not null,
  periodo text,                   -- AAAA-MM: periodo al que cuenta (25 del mes anterior al 24). Permite gastos anticipados
  valor bigint not null check (valor > 0),
  quien text not null check (quien in ('Paul','Luisa')),
  nota text,
  created_by uuid default auth.uid(),
  created_at timestamptz default now()
);
create table if not exists presupuestos (
  mes text not null,              -- formato AAAA-MM
  categoria text not null,
  valor bigint not null default 0,
  primary key (mes, categoria)
);
create table if not exists ahorros (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  mes text not null,              -- mes que se está nivelando (AAAA-MM)
  quien text not null check (quien in ('Paul','Luisa')),
  valor bigint not null check (valor > 0),
  created_at timestamptz default now()
);

-- 3) Alimentación
create table if not exists reglas (
  id text primary key,            -- rp, po, pa, fr, rb, ga
  nombre text not null,
  cuota int not null check (cuota > 0),
  ventana_dias int not null check (ventana_dias > 0),
  icono text,
  orden int not null default 0,
  created_at timestamptz default now()
);
create table if not exists pecados (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  regla_id text not null references reglas(id) on update cascade,
  quien text not null check (quien in ('Paul','Luisa','Juntos')),
  nota text,
  penalizacion text check (penalizacion in ('prestamo','reto')),
  created_at timestamptz default now()
);
create table if not exists retos (
  id uuid primary key default gen_random_uuid(),
  texto text not null unique,
  created_at timestamptz default now()
);
create table if not exists retos_pendientes (
  id uuid primary key default gen_random_uuid(),
  texto text not null,
  quien text not null check (quien in ('Paul','Luisa')),
  hecho boolean not null default false,
  created_at timestamptz default now()
);

-- 4) Planes
create table if not exists planes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  estado text not null default 'idea' check (estado in ('idea','planeado','hecho')),
  fecha date,
  recurrente boolean not null default false,
  hecho_en date,
  icono text,
  fotos text[] not null default '{}',   -- rutas en el bucket "fotos"
  created_at timestamptz default now()
);
create table if not exists plan_historial (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references planes(id) on delete cascade,
  fecha date not null,
  fotos text[] not null default '{}',
  created_at timestamptz default now()
);

-- 5) Seguridad (RLS): solo los miembros (tabla profiles) leen y escriben
do $$
declare t text;
begin
  foreach t in array array['categorias_gasto','gastos','presupuestos','ahorros','reglas','pecados','retos','retos_pendientes','planes','plan_historial']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists miembros on %I', t);
    execute format('create policy miembros on %I for all to authenticated using (es_miembro()) with check (es_miembro())', t);
  end loop;
end $$;

alter table profiles enable row level security;
drop policy if exists perfil_ver on profiles;
drop policy if exists perfil_editar on profiles;
create policy perfil_ver on profiles for select to authenticated using (id = auth.uid() or es_miembro());
create policy perfil_editar on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- 6) Fotos: bucket privado
insert into storage.buckets (id, name, public) values ('fotos', 'fotos', false) on conflict (id) do nothing;
drop policy if exists fotos_miembros on storage.objects;
create policy fotos_miembros on storage.objects for all to authenticated
  using (bucket_id = 'fotos' and public.es_miembro())
  with check (bucket_id = 'fotos' and public.es_miembro());

-- 7) Sincronización en tiempo real
alter publication supabase_realtime add table gastos, presupuestos, ahorros, reglas, pecados, retos, retos_pendientes, planes, plan_historial, categorias_gasto;
