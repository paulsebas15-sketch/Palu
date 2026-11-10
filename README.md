# PaLu (app de Paul y Luisa)

App privada para dos: **gastos de la casa**, **alimentación** (cuotas con ventana móvil) y **planes** con recuerdos.
HTML + CSS + JavaScript sin compilar. Funciona abriendo `index.html` (modo local) o conectada a Supabase (sincronizada).

Contexto y decisiones: documento local (no se publica en el repositorio).

## Estructura (cada archivo hace una sola cosa)

```
index.html            Página única; solo carga CSS y scripts
manifest.json, sw.js  Instalación como app y caché
icons/icon.svg        Ícono
css/
  base.css            Reset, tipografía, layout
  themes.css          Temas dark y pastel (variables de color)
  components.css      Tarjetas, botones, formularios, modal, calendario, polaroid
  nav.css             Encabezado y barra inferior
js/
  config.js           URL y clave de Supabase (vacío = modo local)
  utils.js            Fechas, dinero, ids
  defaults.js         Reglas, categorías, retos y datos de ejemplo
  db.js               ÚNICO archivo que habla con Supabase
  photos.js           Subida y visualización de fotos
  data.js             Estado (S) y operaciones Data.add / upd / del
  ui.js               Modal, avisos, pestañas, selector de mes
  auth.js             Inicio de sesión
  app.js              Arranque, navegación y render
  views/
    inicio.js  gastos.js  comida.js  planes.js  ajustes.js    Una por pantalla
    graficos.js       Gráficos de Gastos (torta, histórico por categoría, ahorro por periodo)
supabase/
  schema.sql          Tablas, seguridad (RLS), bucket de fotos, tiempo real
  seed.sql            Reglas, categorías, retos, fechas y enlace de usuarios
```

**¿Dónde busco si algo falla?** Gastos → `views/gastos.js` · Cuotas de comida → `views/comida.js` (`estadoEn`) ·
Fotos → `photos.js` · Sincronización → `db.js` / `data.js` · Colores → `themes.css`.

## Ver en local

Doble clic en `index.html`. Sin configuración usa datos de ejemplo guardados en el navegador.

## Conectar Supabase (gratis)

1. Crea un proyecto en supabase.com.
2. SQL Editor → pega y ejecuta `supabase/schema.sql`, luego `supabase/seed.sql`.
3. Authentication → Users → crea el usuario de Paul y el de Luisa. En Authentication → Sign In / Providers, **desactiva "Allow new users to sign up"**.
4. Ejecuta en SQL el bloque final de `seed.sql` (con los correos reales) para enlazar cada usuario con su nombre.
5. Project Settings → API: copia **Project URL** y la clave **anon public** en `js/config.js`. Nunca la `service_role`.

## Publicar en GitHub Pages

Sube el contenido de esta carpeta a un repositorio → Settings → Pages → Branch `main` / root.
Si la subes dentro de una carpeta de otro repositorio, Pages la servirá en `/app-paul-y-luisa/`.
En Supabase → Authentication → URL Configuration, agrega la URL de Pages.

## Pendiente

- Probar sincronización real con el proyecto de Supabase (falta URL y clave).
- Íconos PNG 192/512 para instalar en el celular (ahora solo hay SVG).
- Calendario de planes, notificaciones.
