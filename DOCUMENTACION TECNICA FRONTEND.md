# Documentación Técnica Frontend — Grúas y Equipos S.A.S.

> Generado el 2026-03-29. Cubre el estado actual de la rama `main`.

---

## Tabla de Contenidos

1. [Visión general del proyecto](#1-visión-general-del-proyecto)
2. [Estructura de directorios](#2-estructura-de-directorios)
3. [Configuración y setup](#3-configuración-y-setup)
4. [Routing y navegación](#4-routing-y-navegación)
5. [Componentes](#5-componentes)
6. [Páginas y vistas](#6-páginas-y-vistas)
7. [Estado y contexto](#7-estado-y-contexto)
8. [Servicios y API](#8-servicios-y-api)
9. [Sistema de gamificación — FASE 6](#9-sistema-de-gamificación--fase-6)
10. [PWA y Service Worker](#10-pwa-y-service-worker)
11. [Autenticación](#11-autenticación)
12. [Geolocalización](#12-geolocalización)
13. [Firma digital (Signio)](#13-firma-digital-signio)
14. [Utilidades y helpers](#14-utilidades-y-helpers)
15. [Formularios del dominio](#15-formularios-del-dominio)
16. [Responsive y mobile-first](#16-responsive-y-mobile-first)
17. [Patrones y convenciones](#17-patrones-y-convenciones)
18. [Flujos de usuario principales](#18-flujos-de-usuario-principales)

---

## 1. Visión general del proyecto

**Nombre:** LA CENTRAL — super héroes de la construcción
**Empresa:** Grúas y Equipos S.A.S. (Colombia)
**Propósito:** PWA móvil para que operadores de campo registren formularios de seguridad industrial, permisos de trabajo, chequeos de equipos e inspecciones de EPP/EPCC en tiempo real desde la obra.

### Divisiones de negocio

| Código | Nombre | Equipos |
|--------|--------|---------|
| `GyE` (empresa_id=1) | Gruaman | Torres grúa, elevadores de carga |
| `AIC` (empresa_id=2) | Bomberman | Bombas de concreto, mangueras |
| `Tecnicos` (empresa_id=3) | Técnicos | Mantenimiento de equipos |
| `SST` (empresa_id=4) | Seguridad y Salud | Auditorías, hallazgos, PQR |
| `Lideres` (empresa_id=5) | Líderes Bombas | Supervisión de operaciones de bombeo |

### Stack tecnológico

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Framework UI | React | 19.1 |
| Build tool | Vite | 7 |
| Routing | React Router DOM | 7 |
| HTTP | Axios | 1.11 |
| Estilos | TailwindCSS | 4 + CSS modules por componente |
| Animaciones | Framer Motion | 12 |
| Persistencia offline | Dexie (IndexedDB wrapper) | 4 |
| PWA | vite-plugin-pwa | 1.2 |
| Time picker | react-time-picker | 8 |

### Arquitectura de alto nivel

```
Usuario móvil
      │
      ▼
PWA (React SPA)  ──────────── Service Worker (sw.js)
      │                              │
      │  Axios / fetch               │  Push notifications
      ▼                              │  Offline fallback
Backend (Express)◄────────────────────
      │
      ├── PostgreSQL (trabajadores, obras, formularios)
      └── MySQL (datos legacy)
```

La aplicación sigue el patrón **SPA con routing del lado del cliente**. El Service Worker intercepta navigation requests y sirve `index.html` cuando la red falla, lo que permite abrir la app offline. Las llamadas a la API no son interceptadas por el SW (sin cache de datos).

---

## 2. Estructura de directorios

```
prueba1gye-front/
├── public/                         # Assets estáticos servidos directamente
│   ├── sw.js                       # Service Worker (estrategia injectManifest)
│   ├── manifest.json               # Web App Manifest para instalación PWA
│   ├── icon-192.png                # Icono PWA 192×192
│   ├── icon-512.png                # Icono PWA 512×512
│   ├── intro.mp4                   # Video introductorio al abrir la app
│   ├── amigos.mp4                  # Video secundario (unused en producción)
│   ├── gruaman.png                 # Logo Gruaman estático
│   ├── bomberman.png               # Logo Bomberman estático
│   ├── gruaman1.1.gif              # GIF animado personaje Gruaman
│   ├── bomberman1.1.gif            # GIF animado personaje Bomberman
│   ├── fondo.jpeg                  # Imagen de fondo del formulario
│   ├── texto1.png                  # Bocadillo de bienvenida (comic bubble)
│   ├── botonaic.png                # Botón visual AIC
│   ├── botongye.png                # Botón visual GYE
│   ├── logopieaica.png             # Logo footer AIC
│   ├── logopiegye.png              # Logo footer GYE
│   └── _redirects                  # Regla SPA para Netlify/Render: /* /index.html 200
│
├── src/
│   ├── main.jsx                    # Punto de entrada: ReactDOM.createRoot + BrowserRouter + Routes
│   ├── App.jsx                     # Componente raíz: IntroVideo → CedulaIngreso → BienvenidaSeleccion
│   ├── CedulaIngreso.jsx           # Pantalla de login por cédula + WebAuthn + PIN
│   ├── BienvenidaSeleccion.jsx     # Selección de obra + validación GPS
│   ├── App.css                     # Estilos globales del formulario clásico
│   │
│   ├── assets/
│   │   └── react.svg               # SVG por defecto de Vite (no usado en UI)
│   │
│   ├── components/
│   │   ├── Footer.jsx              # Pie de página con logo GYE
│   │   ├── InstallPWAButton.jsx    # Botón flotante "Instalar App" (beforeinstallprompt)
│   │   ├── IntroVideo.jsx          # Reproductor intro.mp4 con auto-skip en conexiones lentas
│   │   ├── SlowConnectionBanner.jsx # Banner bottom-sheet para activar modo lite
│   │   ├── webauthn.js             # Utilidades WebAuthn (register/authenticate/error class)
│   │   │
│   │   ├── game/                   # Sistema de gamificación (FASE 6)
│   │   │   ├── GameFlow.jsx        # Orquestador: rotate → story → map
│   │   │   ├── WorldMap.jsx        # Mapa de misiones estilo Mario Bros
│   │   │   ├── WorldNode.jsx       # Nodo individual del mapa
│   │   │   ├── LevelWrapper.jsx    # Envoltorio de misión (gamificado vs form original)
│   │   │   ├── StoryIntro.jsx      # Intro cinemática con typewriter
│   │   │   ├── RotateScreen.jsx    # Instrucción de rotar pantalla a horizontal
│   │   │   ├── OrientationLock.jsx # Lock de orientación
│   │   │   ├── CircleTransition.jsx # Transición circular in/out
│   │   │   ├── *.css               # Estilos para cada componente de juego
│   │   │   └── questions/
│   │   │       ├── QuestionWrapper.jsx    # Orquestador flip 3D entre preguntas
│   │   │       ├── YesNoQuestion.jsx      # Pregunta Sí/No/N.A. con observaciones
│   │   │       ├── MultiSelectQuestion.jsx # Grid de selección múltiple con flip
│   │   │       ├── TimeRegister.jsx       # Captura automática de hora del dispositivo
│   │   │       ├── TextInputQuestion.jsx  # Input de texto/número/fecha
│   │   │       ├── TimerChallenge.jsx     # Cronómetro regresivo por sección
│   │   │       ├── TypewriterQuestion.jsx # Efecto máquina de escribir
│   │   │       ├── MicroCelebration.jsx   # Animación celebración tras cada respuesta
│   │   │       ├── InventoryItemQuestion.jsx # Pregunta de tipo inventario
│   │   │       └── *.css
│   │   │
│   │   ├── compartido/             # Formularios compartidos Gruaman + Bomberman
│   │   │   ├── permiso_trabajo.jsx # Permiso de trabajo (6 secciones + firma)
│   │   │   ├── chequeo_alturas.jsx # Verificación trabajo en alturas (5 categorías)
│   │   │   ├── horada_ingreso.jsx  # Registro de hora de ingreso
│   │   │   └── hora_salida.jsx     # Registro de hora de salida
│   │   │
│   │   ├── gruaman/                # Formularios específicos Gruaman
│   │   │   ├── eleccion.jsx        # Menú de selección de misiones Gruaman (lite)
│   │   │   ├── chequeo_torregruas.jsx  # Chequeo diario de torre grúa
│   │   │   ├── chequeo_elevador.jsx    # Chequeo diario de elevador de carga
│   │   │   ├── inspeccion_epcc.jsx     # Inspección de EPP/EPCC Gruaman
│   │   │   ├── inspeccion_izaje.jsx    # Inspección de equipos de izaje
│   │   │   ├── AtsSelector.jsx         # Selector de tipo de ATS
│   │   │   └── ats/                    # Formularios ATS por tipo de tarea
│   │   │       ├── AtsOperacionTorregrua.jsx
│   │   │       ├── AtsMandoInalam.jsx
│   │   │       ├── AtsMontajeTorregrua.jsx
│   │   │       ├── AtsMontajeElevador.jsx
│   │   │       ├── AtsDesmontajeTorregrua.jsx
│   │   │       ├── AtsTelescopaje.jsx
│   │   │       ├── AtsMantenimiento.jsx
│   │   │       └── AtsElevador.jsx
│   │   │
│   │   ├── bomberman/              # Formularios específicos Bomberman
│   │   │   ├── eleccionaic.jsx     # Menú de selección de misiones Bomberman (lite)
│   │   │   ├── planillabombeo.jsx  # Planilla de operación de bombas (sub-registros)
│   │   │   ├── checklist.jsx       # Checklist de revisión de bomba (dinámico por cargo)
│   │   │   ├── inspeccion_epcc_bomberman.jsx # Inspección EPP Bomberman
│   │   │   ├── inventariosobra.jsx # Inventario mensual de materiales en obra
│   │   │   ├── herramientas_mantenimiento.jsx # Control de herramientas
│   │   │   └── kit_limpieza.jsx    # Control de kit de lavado
│   │   │
│   │   ├── administrador_gruaman/  # Panel admin Gruaman
│   │   │   ├── administrador.jsx   # Menú principal admin Gruaman
│   │   │   ├── admin_usuarios.jsx  # Gestión de usuarios Gruaman
│   │   │   ├── admins_obras.jsx    # Gestión de obras
│   │   │   ├── permiso_trabajo_admin.jsx
│   │   │   ├── chequeo_alturas_admin.jsx
│   │   │   ├── chequeo_torregruas_admin.jsx
│   │   │   ├── chequeo_elevador_admin.jsx
│   │   │   ├── inspeccion_EPCC_admins.jsx
│   │   │   ├── inspeccion_izaje_admin.jsx
│   │   │   └── horas_extra_gruaman.jsx
│   │   │
│   │   ├── administrador_bomberman/ # Panel admin Bomberman
│   │   │   ├── administrador_bomberman.jsx
│   │   │   ├── admin_usuarios_bomberman.jsx
│   │   │   ├── admin_obras_bomberman.jsx
│   │   │   ├── planilla_bombeo_admin.jsx
│   │   │   ├── checklist_admin.jsx
│   │   │   ├── inspeccion_epcc_bomberman_admin.jsx
│   │   │   ├── inventarios_obra_admin.jsx
│   │   │   ├── herramientas_mantenimiento_admin.jsx
│   │   │   ├── kit_limpieza_admin.jsx
│   │   │   └── horas_extra_bomberman.jsx
│   │   │
│   │   ├── administrador/
│   │   │   └── RegistrosDiariosAdmin.jsx # Visor multi-empresa + descarga Excel/PDF
│   │   │
│   │   ├── sst/                    # Formularios para rol SST
│   │   │   ├── eleccion_sst.jsx    # Menú SST
│   │   │   ├── pqr.jsx             # Peticiones, quejas y reclamos
│   │   │   ├── hallazgos.jsx       # Reporte de hallazgos
│   │   │   ├── acta_visita_grua.jsx
│   │   │   └── acta_visita_elevador.jsx
│   │   │
│   │   ├── tecnicos/               # Formularios para rol Técnicos
│   │   │   ├── eleccion_tecnicos.jsx
│   │   │   ├── checklist_mantenimiento_elevador.jsx
│   │   │   └── checklist_mentinimiento_grua.jsx
│   │   │
│   │   └── Lideres_bombas/         # Formularios para Líderes de Bombas
│   │       └── eleccion_lideres.jsx
│   │
│   ├── config/
│   │   └── gameConfig.js           # Configuración de mundos, misiones y personajes
│   │
│   ├── db/
│   │   └── gameProgress.js         # Gestión de progreso con localStorage (sesión 16h)
│   │
│   ├── hooks/
│   │   └── useFormGenerales.js     # Hook que resuelve datos del operador/obra para formularios
│   │
│   ├── styles/
│   │   ├── formulario1.css         # Estilos base del sistema de formularios clásico
│   │   └── permiso_trabajo.css     # Estilos específicos del permiso de trabajo y botones
│   │
│   ├── utils/
│   │   ├── api.js                  # Instancia central de Axios con baseURL
│   │   ├── formParser.js           # Motor de gamificación: worldId → Section[] | null
│   │   ├── dateUtils.js            # Helpers de fecha en zona Colombia
│   │   └── questionTypes.js        # Configuración de timers por tipo de sección
│   │
│   ├── index.css                   # Estilos globales + Tailwind preflight/utilities + nubes
│   ├── pushNotifications.js        # subscribeUser() — registro Web Push
│   └── .env.local                  # Variables de entorno de desarrollo (gitignored)
│
├── .env                            # Variable VITE_API_BASE_URL (dev local)
├── vite.config.js                  # Configuración Vite + PWA plugin
├── tailwind.config.js              # Configuración Tailwind (content paths)
├── postcss.config.js               # PostCSS con @tailwindcss/postcss
├── eslint.config.js                # ESLint con react-hooks + react-refresh
├── index.html                      # HTML raíz con <div id="root">
├── localhost-key.pem               # Certificado SSL desarrollo (gitignored)
├── localhost.pem                   # Certificado SSL desarrollo (gitignored)
└── package.json
```

---

## 3. Configuración y setup

### Variables de entorno

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| `VITE_API_BASE_URL` | `https://gruaman-bomberman-back.onrender.com` | URL base del backend. Se sobreescribe con `http://localhost:3000` en desarrollo |

El archivo `.env` en la raíz define `VITE_API_BASE_URL=http://localhost:3000`.
En producción (Render), la variable debe configurarse en el panel de la plataforma.

### Comandos disponibles

```bash
npm run dev      # Servidor de desarrollo con HMR en https://localhost:4000
npm run build    # Build de producción en dist/
npm run preview  # Preview del build de producción
npm run lint     # ESLint
```

### HTTPS en desarrollo

`vite.config.js` intenta cargar `localhost-key.pem` y `localhost.pem`. Si no existen (producción / CI), el servidor corre sin HTTPS. Los certificados son necesarios para WebAuthn y Service Worker en desarrollo local.

### Configuración PWA

```js
VitePWA({
  strategies: 'injectManifest',  // Usa el sw.js propio (public/sw.js)
  srcDir: 'public',
  filename: 'sw.js',
  injectRegister: false,         // El registro del SW se hace manualmente
  manifest: { ... },
  injectManifest: { injectionPoint: undefined }
})
```

La estrategia `injectManifest` permite mantener el Service Worker artesanal en `public/sw.js`.

### Tailwind CSS

Versión 4 con PostCSS. El `tailwind.config.js` apunta a `./src/**/*.{js,ts,jsx,tsx}` y `./index.html`. El archivo `src/index.css` importa `tailwindcss/preflight` y `tailwindcss/utilities`.

---

## 4. Routing y navegación

Toda la configuración de rutas vive en `src/main.jsx` usando `BrowserRouter` y `Routes`. No hay rutas declaradas en archivos separados de configuración.

### Árbol de rutas

```
/                              → App (IntroVideo + CedulaIngreso + BienvenidaSeleccion)
/bienvenida                    → BienvenidaSeleccion (standalone, redirect desde juego)

── Gruaman ──────────────────────────────────────────────────────────────────
/eleccion                      → Bienvenida (menú de misiones Gruaman — modo lite)
/chequeo_torregruas            → ChequeoTorreGruas
/inspeccion_epcc               → InspeccionEPCC
/inspeccion_izaje              → InspeccionIzaje
/chequeo_elevador              → ChequeoElevador
/ats-selector                  → AtsSelector
/ats-operacion-torregrua       → AtsOperacionTorregrua
/ats-mando-inalam              → AtsMandoInalam
/ats-montaje-torregrua         → AtsMontajeTorregrua
/ats-montaje-elevador          → AtsMontajeElevador
/ats-desmontaje-torregrua      → AtsDesmontajeTorregrua
/ats-telescopaje               → AtsTelescopaje
/ats-mantenimiento             → AtsMantenimiento
/ats-elevador                  → AtsElevador

── Bomberman ────────────────────────────────────────────────────────────────
/eleccionaic                   → BienvenidaAIC (menú de misiones Bomberman — modo lite)
/planillabombeo                → PlanillaBombeo
/checklist                     → Checklist
/inventariosobra               → InventarioObra
/herramientas_mantenimiento    → HerramientasMantenimiento
/kit_limpieza                  → KitLimpieza

── Compartido ───────────────────────────────────────────────────────────────
/permiso_trabajo               → PermisoTrabajo
/chequeo_alturas               → ChequeoAlturas
/hora_ingreso                  → HoraIngreso
/hora_salida                   → HoraSalida

── Juego (FASE 6) ───────────────────────────────────────────────────────────
/game/rotate-screen            → GameFlow step="rotate"
/game/story-intro              → GameFlow step="story"
/game/world-map                → GameFlow step="map" (WorldMap)
/game/level/:worldId           → LevelWrapper (misión individual)

── Admin Gruaman ────────────────────────────────────────────────────────────
/administrador                 → AdministradorGruaman (menú)
/permiso_trabajo_admin         → PermisoTrabajoAdmin
/chequeo_alturas_admin         → ChequeoAlturasAdmin
/chequeo_torregruas_admin      → ChequeoTorreGruasAdmin
/chequeo_elevador_admin        → ChequeoElevadorAdmin
/inspeccion_epcc_admins        → InspeccionEPCCAdmins
/inspeccion_izaje_admin        → InspeccionIzajeAdmin
/admin_usuarios                → AdminUsuarios
/admins_obras                  → AdminsObras
/horas_extra_gruaman           → HorasExtraGruamanAdmin

── Admin Bomberman ──────────────────────────────────────────────────────────
/administrador_bomberman       → AdministradorBomberman (menú)
/planilla_bombeo_admin         → PlanillaBombeoAdmin
/checklist_admin               → ChecklistAdmin
/inventarios_obra_admin        → InventariosObraAdmin
/inspeccion_epcc_bomberman_admin → InspeccionEPCCBombermanAdmin
/herramientas_mantenimiento_admin → HerramientasMantenimientoAdmin
/kit_limpieza_admin            → KitLimpiezaAdmin
/admin_usuarios_bomberman      → AdminUsuariosBomberman
/admin_obras_bomberman         → AdminObrasBomberman
/horas_extra_bomberman         → HorasExtraBombermanAdmin

── Otros roles ──────────────────────────────────────────────────────────────
/eleccion_sst                  → EleccionSST
/eleccion_tecnicos             → EleccionTecnicos
/eleccion_lideres              → EleccionLideres
/pqr                           → PQR
/hallazgos                     → Hallazgos
/registros_diarios_admin       → RegistrosDiariosAdmin
```

### Protección de rutas

No hay un componente `PrivateRoute` formal. La protección se basa en:
1. **localStorage**: si `nombre_trabajador` o `cedula_trabajador` no existen, los componentes de formulario muestran datos vacíos, pero no redirigen automáticamente.
2. **Flujo de login**: `CedulaIngreso` llama a `onUsuarioEncontrado` sólo tras autenticación exitosa; sin eso, el usuario nunca llega a `BienvenidaSeleccion` ni a las rutas de formulario.
3. **GameFlow**: si `selectedCharacter` no existe en localStorage, `GameFlow` redirige a `/bienvenida`.
4. **Admin**: `CedulaIngreso` contiene un modal de contraseña de administrador; al validarla, navega a `/administrador` o `/administrador_bomberman` según el `rol` retornado por `/admin/login`.

---

## 5. Componentes

### App.jsx

Componente raíz renderizado en `/`. Gestiona el flujo de intro:
- Estado `usuario` (null hasta autenticación).
- Muestra `IntroVideo` en la primera carga (omitido si `lite_mode === 'true'` en sessionStorage).
- Al terminar el video, alterna entre `CedulaIngreso` y `BienvenidaSeleccion` según `usuario`.
- Al autenticarse, llama a `subscribeUser(trabajadorId)` para registrar push notifications.
- Muestra `SlowConnectionBanner` si el video tarda más de 6 segundos en reproducirse.
- `InstallPWAButton` siempre montado al fondo del árbol.

**Props:** ninguna
**Estado local:** `usuario`, `showIntro`, `showLiteBanner`

---

### CedulaIngreso.jsx

Pantalla de ingreso con dos flujos de autenticación:

**Flujo principal (operadores):**
1. El usuario escribe su número de cédula.
2. Se consulta `GET /datos_basicos` y se busca el trabajador con `activo === true`.
3. Si el dispositivo soporta WebAuthn (`checkWebAuthnSupport()`):
   - Si no tiene credencial registrada → se ofrece registrar una nueva.
   - Si tiene credencial → se autentica con biometría.
4. Sin soporte WebAuthn → modal de PIN (crear o verificar).
5. Al autenticar con éxito, guarda en localStorage: `nombre_trabajador`, `cedula_trabajador`, `empresa_id`, y llama `onUsuarioEncontrado(usuario)`.

**Flujo admin (modal separado):**
- Botón en esquina inferior derecha abre modal de contraseña.
- `POST /admin/login` con `{ password }`.
- Respuesta incluye `rol` que determina la ruta: `administrador`, `administrador_bomberman`, `administrador_ambas`, `registros_diarios`, etc.

**Props:**
- `onUsuarioEncontrado(usuario)` — callback cuando se autentica un operador.

**Hooks internos:**
- `useIsMobile()` — detecta viewport < 600px.
- Estados: `cedula`, `error`, `gifIndex`, `showAdminModal`, `showRegistrarLlaveModal`, `showPinModal`, y variables de PIN/WebAuthn.

---

### BienvenidaSeleccion.jsx

Pantalla post-login donde el trabajador elige la obra activa. Incluye validación GPS.

**Flujo:**
1. Carga obras activas desde `GET /obras`.
2. Al seleccionar obra: guarda en localStorage (`obra`, `obra_id`, `constructora`, `nombre_proyecto`) y solicita GPS.
3. Botón "Empecemos": valida coordenadas contra `POST /validar_ubicacion`.
4. Si la distancia es menor a 500 m → navega al flujo de juego o al menú lite según `empresa` y `lite_mode`.

**Navegación por rol:**
| Empresa | Destino (modo juego) | Destino (modo lite) |
|---------|---------------------|---------------------|
| `GyE` | `/game/rotate-screen` | `/eleccion` |
| `AIC` | `/game/rotate-screen` | `/eleccionaic` |
| `Lideres` | — | `/eleccion_lideres` |
| `SST` | — | `/eleccion_sst` |
| `Tecnicos` | — | `/eleccion_tecnicos` |

**Props:** `usuario` (objeto con `nombre`, `empresa`, `numero_identificacion`).

**Hooks internos:** `useIsLandscape()`.

---

### IntroVideo.jsx

Reproductor a pantalla completa de `/intro.mp4`.
- Temporizador de 6000ms: si el video no inicia → `onSlowDetected()`.
- Maneja `onEnded`, `onError`, `onStalled` → todos llaman a `escape()`.
- Transición de fundido de 400ms antes de desmontarse.

**Props:** `onVideoEnd()`, `onSlowDetected()`.

---

### SlowConnectionBanner.jsx

Banner bottom-sheet animado (slide-up) con dos opciones:
- "Usar versión lite →" → guarda `lite_mode=true` en sessionStorage y recarga sin animaciones.
- "Ignorar" → descarta el banner.

**Props:** `onUseLite()`, `onDismiss()`.

---

### InstallPWAButton.jsx

Captura el evento `beforeinstallprompt` y muestra un botón flotante centrado en la parte inferior. Solo visible en mobile (viewport ≤ 600px). Se oculta tras la respuesta del usuario al prompt.

---

### Footer.jsx

Componente simple que renderiza el logo de GYE en el pie de página.

---

### SOSButton (en main.jsx)

Botón circular rojo flotante visible solo en mobile. Arrastrable con `useDraggable()` (pointer events). Al tocar:
1. Modal con opciones: "Llamar" (tel:) o "Escribir mensaje" (WhatsApp).
2. WhatsApp: pregunta si es Gruaman o Bomberman.
3. Bomberman: elige región (Cundinamarca / Antioquia / Atlántico).
4. Copia mensaje SOS al portapapeles antes de abrir el grupo de WhatsApp.

---

### STOPButton (en main.jsx)

Botón flotante naranja (STOP) para acceder al panel de administrador directamente desde cualquier pantalla de formulario. Solo visible en mobile.

---

### GameFlow.jsx

Orquestador del flujo narrativo del juego:
- `step="rotate"` → `RotateScreen` (instrucción de rotar a horizontal).
- `step="story"` → `StoryIntro` (intro cinemática con typewriter).
- `step="map"` → `WorldMap`.
- Gestiona `CircleTransition` in/out entre pasos.
- Guarda `selectedCharacter` en localStorage (gruaman/bomberman).

---

### WorldMap.jsx

Mapa de misiones estilo Mario Bros con scroll vertical.
- Lee `selectedCharacter` y `nombre_trabajador` de localStorage.
- Renderiza `WorldNode` para cada misión en patrón zigzag (right → left → center).
- Conecta nodos con líneas SVG punteadas.
- Muestra tutorial la primera vez (auto-dismissal a los 6 segundos).
- Progreso: `completedCount / dailyWorlds.length` en barra horizontal.
- Al seleccionar nodo → `CircleTransition out` → navega a `/game/level/:worldId`.

---

### WorldNode.jsx

Tarjeta de misión individual en el mapa.

**Props:**
- `world` — objeto de `gameConfig` con `id`, `name`, `icon`, `color`, `bgColor`, `order`, `shared`.
- `status` — `'completed' | 'in_progress' | 'pending' | 'optional' | 'locked'`.
- `isHighlighted` — activa bounce animation (tutorial).
- `onClick(id)` — solo cuando no está bloqueado.

---

### LevelWrapper.jsx

Envoltorio de misión individual en `/game/level/:worldId`. Opera en dos modos:

**Modo gamificado** (cuando `parseFormToQuestions(worldId)` retorna secciones):
1. Renderiza `QuestionWrapper` por cada sección secuencialmente.
2. Acumula respuestas en `allAnswersRef` (ref + estado).
3. Persiste respuestas parciales en `sessionStorage` (clave `lw_answers_{worldId}`).
4. Al completar la última sección: llama `submitFormData(worldId, answers)`.
5. En éxito: `markWorldComplete(worldId)` → navega a `/game/world-map`.
6. En error: muestra botón de reintento.

**Modo formulario original** (cuando `parseFormToQuestions` retorna null):
1. Carga el componente correspondiente de `FORM_MAP` con `React.lazy + Suspense`.
2. El formulario escribe `game_mode` en localStorage.
3. `WorldMap` detecta `game_mode` al montar y marca el mundo como completado.

**FORM_MAP** (mapa worldId → componente lazy):
```
hora-ingreso              → horada_ingreso
permiso-trabajo           → permiso_trabajo
chequeo-altura            → chequeo_alturas
hora-salida               → hora_salida
planilla-bombeo           → planillabombeo
checklist                 → checklist
inspeccion-epcc-bomberman → inspeccion_epcc_bomberman
inventarios-obra          → inventariosobra
herramientas-mantenimiento→ herramientas_mantenimiento
kit-limpieza              → kit_limpieza
chequeo-torregruas        → chequeo_torregruas
inspeccion-epcc           → inspeccion_epcc
inspeccion-izaje          → inspeccion_izaje
chequeo-elevador          → chequeo_elevador
ats                       → AtsSelector
```

---

### QuestionWrapper.jsx

Orquestador de preguntas con animación flip 3D.

**Flujo por pregunta:**
1. `phase='enter'` → animación flipIn (350ms) → `phase='idle'`
2. Usuario responde → `handleAnswer(questionId, value, extraAnswers?)`
3. `phase='exit'` → animación flipOut (350ms)
4. `phase='celebrating'` → `MicroCelebration` (~900ms) → `handleCelebrationDone`
5. Si quedan preguntas: avanza índice. Si no: llama `onComplete(answers)`.

**Respuestas almacenadas:**
- Por `questionId` en `answersRef.current` (ref para evitar stale closures).
- Si la respuesta tiene `extraAnswers` (ej: observación en preguntas negativas), se fusionan al mapa.

**Props:**
- `questions` — array de objetos de pregunta.
- `onComplete(answers)` — callback al finalizar todas.
- `sectionName` — para aria-label.
- `timerConfig` — `{ duration: number }` o null.

**Tipos de pregunta soportados:**
- `yesno` (o sin tipo) → `YesNoQuestion`
- `multiselect` → `MultiSelectQuestion`
- `time` → `TimeRegister`
- `text` / `number` / `date` → `TextInputQuestion`
- `inventory-item` → `InventoryItemQuestion`

---

### YesNoQuestion.jsx

Bocadillo de diálogo con botones táctiles grandes.
- `TypewriterQuestion` escribe la pregunta; al terminar, los botones aparecen con bounceIn.
- Opciones por defecto: Sí (verde), No (rojo), N/A (gris).
- `customOptions` sobreescribe los botones predeterminados (usado por checklist y ATS).
- Opción `negative: true` → al seleccionar muestra textarea de observación antes de confirmar.
- Al confirmar, retorna `extraAnswers` con `{ [questionId + '_obs']: texto }`.

---

### MultiSelectQuestion.jsx

Grid de cards con flip 180° al seleccionar.
- Mínimo configurable de selecciones antes de habilitar "Confirmar".
- Retorna `value: string[]` al `onAnswer`.

---

### TimeRegister.jsx

Captura `new Date()` al montar (no al confirmar). Muestra hora en formato `H:MM a.m./p.m.`. Retorna `date.toISOString()`. La conversión a `HH:MM` para el backend se hace en `formParser.js`.

---

### StoryIntro.jsx

4 diálogos de intro cinemática escritos con efecto typewriter (50ms/carácter). Pausa de 1600ms entre diálogos. Botón "Saltar intro" disponible siempre. Usa el nombre del personaje y la obra desde props.

---

### CircleTransition.jsx

Transición circular que cubre o revela la pantalla.
- `direction="in"` → revela (la pantalla aparece desde un círculo que crece).
- `direction="out"` → cubre (un círculo negro cubre la pantalla).
- Llama `onDone()` al completar la animación CSS.

---

## 6. Páginas y vistas

### Menús de selección de misiones

| Componente | Ruta | Rol | Reinicio diario |
|-----------|------|-----|----------------|
| `eleccion.jsx` | `/eleccion` | GyE (modo lite) | Medianoche Colombia |
| `eleccionaic.jsx` | `/eleccionaic` | AIC (modo lite) | Medianoche Colombia; inventarios: primer día del mes |
| `eleccion_sst.jsx` | `/eleccion_sst` | SST | Medianoche Colombia |
| `eleccion_tecnicos.jsx` | `/eleccion_tecnicos` | Tecnicos | Medianoche Colombia |
| `eleccion_lideres.jsx` | `/eleccion_lideres` | Lideres | Medianoche Colombia |

Todos siguen el mismo patrón: `getUsadosFromStorage(usuario)` → map de `worldId: boolean` → al usar un formulario se marca como `true` y se persiste. Los botones con `usados[x] === true` aparecen en un estado visual diferente (usualmente atenuados o con check). Al cambiar de día se limpia automáticamente el mapa mediante un `setTimeout` a la medianoche.

### Paneles de administración

**AdministradorGruaman** (`/administrador`):
- Acceso solo vía modal de contraseña en `CedulaIngreso`.
- Muestra botones que navegan a cada sub-panel de formularios.
- Sub-paneles: permiso de trabajo, chequeo alturas, torregrúas, elevador, EPCC, izaje, obras, usuarios, horas extra.

**AdministradorBomberman** (`/administrador_bomberman`):
- Similar a Gruaman pero para los formularios Bomberman.
- Sub-paneles: planilla bombeo, checklist, EPCC, inventarios, herramientas, kit limpieza, obras, usuarios, horas extra.

**RegistrosDiariosAdmin** (`/registros_diarios_admin`):
- Panel transversal accesible con contraseña de master.
- Busca trabajadores en todas las empresas por nombre y rango de fechas.
- Descarga reportes en Excel y PDF como blobs binarios.

### Formularios de administración (sufijo `_admin`)

Cada formulario tiene su vista de administración correspondiente que:
- Lista registros existentes con filtros de fecha/obra/trabajador.
- Permite descarga en PDF/Excel vía endpoints dedicados del backend.
- Muestra los campos en modo solo lectura con datos del registro guardado.

---

## 7. Estado y contexto

La aplicación no usa Context API ni stores globales (no hay Redux, Zustand ni React Query). El estado se gestiona exclusivamente por:

### Estado local React (useState)

Cada componente mantiene su propio estado. No existe estado compartido entre componentes hermanos vía contexto.

### localStorage — datos de sesión de usuario

Clave | Descripción | Escrito por
------|-------------|------------
`usuario` | Objeto JSON del trabajador autenticado | `BienvenidaSeleccion`
`nombre_trabajador` | Nombre del trabajador | `CedulaIngreso`, `BienvenidaSeleccion`
`cedula_trabajador` | Número de identificación | `CedulaIngreso`
`empresa_id` | ID numérico de empresa | `CedulaIngreso`
`empresa_trabajador` | Nombre de empresa | `BienvenidaSeleccion`
`cargo_trabajador` | Cargo del trabajador | `BienvenidaSeleccion`
`obra` | Nombre de la obra activa | `BienvenidaSeleccion`
`obra_id` | ID de la obra activa | `BienvenidaSeleccion`
`nombre_proyecto` | Alias del nombre de obra | `BienvenidaSeleccion`
`constructora` | Nombre del cliente/constructora | `BienvenidaSeleccion`
`selectedCharacter` | `'gruaman'` o `'bomberman'` | `BienvenidaSeleccion`
`game_mode` | worldId del formulario que está activo | `LevelWrapper`
`game_tutorial_seen` | Flag de tutorial visto | `WorldMap`
`game_session_{cedula}_{obraId}` | Objeto de sesión de progreso (16h) | `gameProgress.js`
`{rol}_usados_{usuario}` | Map de formularios usados hoy | `eleccion.jsx`, `eleccionaic.jsx`, etc.
`{rol}_usados_fecha_{usuario}` | Fecha del último reset | idem
`gruaman_usados_{usuario}` | Uso diario formularios Gruaman | `eleccion.jsx`
`aic_usados_{usuario}` | Uso diario formularios Bomberman | `eleccionaic.jsx`

### sessionStorage

Clave | Descripción | Escrito por
------|-------------|------------
`lite_mode` | `'true'` si el usuario eligió modo lite | `SlowConnectionBanner`
`lw_answers_{worldId}` | Respuestas parciales de la misión actual | `LevelWrapper`

### Persistencia de formularios semanales

Varios formularios usan `getCurrentWeekKey()` para persistir respuestas semanalmente en localStorage, evitando que el trabajador repita campos que no cambian durante la semana (cliente, proyecto, equipos, etc.). Se limpian automáticamente los domingos.

---

## 8. Servicios y API

### Instancia central de Axios

`src/utils/api.js` exporta una instancia de Axios preconfigurada:

```js
const api = axios.create({ baseURL: API_BASE_URL });
export default api;
```

**Varios componentes** todavía importan `axios` directamente y construyen la URL manualmente con `import.meta.env.VITE_API_BASE_URL`. Esto es una deuda técnica; la intención es unificar todo en `api.js`.

### Endpoints consumidos

#### Autenticación y datos
| Método | Endpoint | Uso |
|--------|---------|-----|
| GET | `/datos_basicos` | Lista de trabajadores con `activo`, `empresa_id`, etc. |
| POST | `/admin/login` | Login de administrador con contraseña |
| POST | `/webauthn/register/options` | Opciones de registro de credencial |
| POST | `/webauthn/register/verify` | Verificación de attestation |
| POST | `/webauthn/authenticate/options` | Opciones de autenticación |
| POST | `/webauthn/authenticate/verify` | Verificación de assertion |
| GET | `/vapid-public-key` | Clave pública VAPID para push |
| POST | `/push/subscribe` | Registro de suscripción push |

#### Obras y geolocalización
| Método | Endpoint | Uso |
|--------|---------|-----|
| GET | `/obras` | Lista de obras con coordenadas y estado `activa` |
| POST | `/validar_ubicacion` | `{ obra_id, lat, lon }` → `{ ok, distancia }` |

#### Formularios — envío
| Método | Endpoint | Formulario |
|--------|---------|------------|
| POST | `/compartido/permiso_trabajo` | Permiso de trabajo |
| POST | `/compartido/chequeo_alturas` | Chequeo de alturas |
| POST | `/compartido/hora_ingreso` | Registro de ingreso |
| POST | `/compartido/hora_salida` | Registro de salida |
| POST | `/gruaman/chequeo_torregruas` | Chequeo torre grúas |
| POST | `/gruaman/chequeo_elevador` | Chequeo elevador |
| POST | `/gruaman/inspeccion_epcc` | Inspección EPCC Gruaman |
| POST | `/gruaman/inspeccion_izaje` | Inspección izaje |
| POST | `/gruaman/ats` | Análisis de Trabajo Seguro |
| POST | `/bomberman/planilla_bombeo` | Planilla bombeo |
| POST | `/bomberman/checklist` | Checklist bomba |
| POST | `/bomberman/inspeccion_epcc` | Inspección EPCC Bomberman |
| POST | `/bomberman/inventarios_obra` | Inventarios obra |
| POST | `/bomberman/herramientas_mantenimiento` | Herramientas |
| POST | `/bomberman/kit_limpieza` | Kit de lavado |

#### Administración — consulta y descarga
| Método | Endpoint | Uso |
|--------|---------|-----|
| GET | `/admin/permiso_trabajo` | Lista con filtros |
| GET | `/admin/permiso_trabajo/pdf/:id` | PDF individual |
| GET | `/admin/permiso_trabajo/excel` | Excel bulk |
| GET | `/admin/registros_diarios` | Registros multi-empresa |
| GET | `/admin/registros_diarios/excel` | Excel bulk multi-empresa |
| ... | (idem patrón para cada formulario) | |

### Manejo de errores

Los formularios envuelven el `POST` en `try/catch` y muestran el mensaje de error al usuario con `setError()`. Los campos de observación en respuestas negativas (YesNoQuestion) siguen el mismo patrón. El `LevelWrapper` tiene estado `submitError` con botón de reintento.

---

## 9. Sistema de gamificación — FASE 6

La FASE 6 convierte los formularios de checklist en una experiencia gamificada estilo videojuego, pero sin modificar el payload que recibe el backend.

### Arquitectura

```
gameConfig.js     → Define misiones (worldId, nombre, icono, orden)
formParser.js     → worldId → Section[] | null
gameProgress.js   → Gestión de sesión (localStorage, 16h)
LevelWrapper.jsx  → Orquestador modo gamificado / modo form
QuestionWrapper.jsx → Flip 3D entre preguntas de una sección
```

### formParser.js en detalle

#### Función principal

```js
parseFormToQuestions(worldId) → Section[] | null
```

- Retorna `null` para formularios **no gamificados** (ver lista abajo).
- Retorna un array de `Section` para formularios gamificados.
- Cuando retorna `null`, `LevelWrapper` carga el componente original con `React.lazy`.

#### Estructura de Section

```js
{
  id: string,           // identificador único de la sección
  name: string,         // nombre de display
  enableTimer: boolean, // si true, muestra TimerChallenge
  timerDuration: number,// segundos (opcional, usa TIMER_CONFIG como fallback)
  questions: Question[]
}
```

#### Estructura de Question

```js
{
  id: string,           // SIEMPRE igual a fieldName (regla crítica)
  fieldName: string,    // nombre del campo en el payload del backend
  type: 'yesno' | 'multiselect' | 'time' | 'text' | 'number' | 'date' | 'inventory-item',
  question: string,     // texto de la pregunta
  icon: string?,        // emoji de display
  critical: boolean?,   // marca pregunta crítica (visual)
  customOptions: [],    // sobreescribe opciones de YesNoQuestion
  options: []           // para multiselect
}
```

**Regla crítica:** `question.id === question.fieldName` siempre. `QuestionWrapper` almacena respuestas indexadas por `question.id`, y `submitFormData` los mapea a campos del backend.

#### Función submitFormData

```js
submitFormData(worldId, answers) → Promise<void>
```

Toma las respuestas crudas del juego (`answers`) y las convierte al payload exacto que esperan los endpoints originales, luego hace el POST. Utiliza `getGameContext()` para rellenar campos de metadatos (operador, cargo, cliente, proyecto) desde localStorage.

#### Helper yn(val)

Convierte valores gamificados a formato backend:
- `'yes'` → `'SI'`
- `'no'` → `'NO'`
- `'na'` → `'NA'`

#### Helper getGameContext()

Lee de localStorage y retorna:
```js
{
  operador:  localStorage.get('nombre_trabajador'),
  cargo:     localStorage.get('cargo_trabajador'),
  cliente:   localStorage.get('constructora'),
  proyecto:  localStorage.get('nombre_proyecto') || localStorage.get('obra'),
  obraId:    localStorage.get('obra_id'),
}
```

### Formularios gamificados

| worldId | Secciones | Notas |
|---------|-----------|-------|
| `hora-ingreso` | 1 (inicio jornada) | Una sola pregunta de confirmación |
| `hora-salida` | 1 (fin jornada) | Una sola pregunta de confirmación |
| `permiso-trabajo` | 6 | Con timers en EPP (90s), SRPDC (120s), Precauciones (120s) |
| `chequeo-altura` | 5 (salud, seguridad, acceso, izaje, eléctrico) | Timers en seguridad (120s) y eléctrico (90s) |
| `chequeo-torregruas` | 3 | Timer en controles operacionales (120s) |
| `chequeo-elevador` | 3 | Timer en controles operacionales |
| `inspeccion-epcc` | 2 | EPP Gruaman |
| `inspeccion-izaje` | 2 | Equipos de izaje |
| `inspeccion-epcc-bomberman` | 2 | EPP Bomberman |
| `checklist` | dinámico | Secciones filtradas por cargo (operario/auxiliar) |
| `ats-*` | dinámico | Secciones comunes + una sección por paso del ATS |

### Formularios NO gamificados (retornan null)

| worldId | Razón |
|---------|-------|
| `planilla-bombeo` | Componente especial con sub-registros de remisiones; nunca gamificar |
| `hora-ingreso` (sí gamificado) | — |
| `inventarios-obra` | Formulario de tipo inventario con lógica especial |
| `herramientas-mantenimiento` | Form con tablas de ítems |
| `kit-limpieza` | Form con tablas de ítems |

### Checklist dinámico por cargo

`buildChecklistSections()` detecta el cargo del trabajador desde localStorage:
- `'auxiliar'` → muestra campos de sección hidráulica, eléctrica, mangueras, tubería.
- `'operario'` → muestra campos de chasis, piezas de desgaste, lubricación, combustible.
- Sin cargo identificado → muestra todos.

La función `campoVisibleParaCargo(field, cargo)` consulta `CHECKLIST_ITEM_ROLES` para decidir si un campo aplica al cargo.

### ATS dinámico por tipo

`buildAtsSections(worldId)` retorna:
- 3 secciones comunes de selección de riesgos (físicos/eléctricos, químicos/ergonómicos, locativos/mecánicos).
- 1 sección de herramientas (6 preguntas de texto).
- 1 sección de EPP (multiselect).
- N secciones de pasos (una por cada paso del ATS, con `customOptions: [{value: 'yes', label: 'Entendido ✓'}]`).

Los datos de pasos por tipo (`ATS_PASOS`) están embebidos en `formParser.js` como constantes con peligros, consecuencias y controles de cada paso.

### Sistema de progreso (gameProgress.js)

```
Clave:  game_session_{cedula}_{obraId}
Valor:  { startedAt: timestamp, completed: string[] }
Duración: 16 horas desde el primer registro del día
```

**`computeWorldStatus(world, completedIds, allWorlds)`:**
- `completed` → ya fue completado.
- `optional` → `world.daily === false` (no bloquea el flujo).
- `pending` → primer mundo diario sin completar (desbloqueado).
- `locked` → aún no es su turno.

### Configuración de timers (questionTypes.js)

| sectionId | duration | bonusThreshold |
|-----------|----------|----------------|
| `epp` | 90s | 60s |
| `srpdc` | 120s | 90s |
| `revision` | 180s | 120s |
| `sistemas` | 150s | 100s |

`getTimerConfig(sectionId)` retorna la configuración o `null` si la sección no tiene timer.

---

## 10. PWA y Service Worker

### Estrategia de cache

El Service Worker (`public/sw.js`) usa una estrategia **network-first mínima**:
- Intercepta únicamente `navigation requests` (modo `navigate`).
- Si la red falla → intenta `caches.match('/index.html')`.
- Las llamadas a la API y los assets **no son interceptados** (no hay cache de datos).

Esto permite abrir la app sin red una vez instalada, pero los formularios requieren conectividad para enviar datos.

### Ciclo de vida del SW

```js
install → skipWaiting()   // Activación inmediata sin esperar a cerrar pestañas
activate → clients.claim() // Toma control inmediato de todas las pestañas
```

### Push Notifications

**Flujo de suscripción:**
1. App autentica al trabajador (`App.jsx` escucha `trabajadorId`).
2. Llama `subscribeUser(trabajadorId)` de `pushNotifications.js`.
3. Obtiene clave VAPID pública desde `GET /vapid-public-key`.
4. Crea suscripción con `PushManager.subscribe()`.
5. Envía subscription JSON a `POST /push/subscribe` con el número de identificación.

**Recepción en SW:**
```
push event → parsea JSON → showNotification()
notificationclick → cierra → enfoca/abre ventana en data.url
```

Las notificaciones usan `requireInteraction: true` y `tag: 'push-notification-' + Date.now()` para evitar agrupamiento.

### Web App Manifest

```json
{
  "short_name": "LA CENTRAL",
  "name": "LA CENTRAL, super heroes de la construccion",
  "display": "standalone",
  "theme_color": "#1976d2",
  "background_color": "#ffffff",
  "start_url": ".",
  "gcm_sender_id": "103953800507"
}
```

El `_redirects` en `public/` garantiza que el routing SPA funcione en Render/Netlify:
```
/* /index.html 200
```

---

## 11. Autenticación

### Flujo completo de operador

```
1. CedulaIngreso: usuario escribe cédula
2. GET /datos_basicos → busca trabajador activo
3a. WebAuthn soportado:
    - Sin credencial → POST /webauthn/register/options
                    → navigator.credentials.create()
                    → POST /webauthn/register/verify
    - Con credencial → POST /webauthn/authenticate/options
                    → navigator.credentials.get()
                    → POST /webauthn/authenticate/verify
3b. Sin WebAuthn:
    - Sin PIN registrado → modal crear PIN → POST /trabajadores/:id/pin
    - Con PIN            → modal verificar PIN → POST /trabajadores/:id/pin/verify
4. onUsuarioEncontrado(usuario) → App.jsx sube estado
5. BienvenidaSeleccion guarda en localStorage y navega
```

### WebAuthn (webauthn.js)

`checkWebAuthnSupport()` usa `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()`. Solo activa WebAuthn en dispositivos con biometría de plataforma (Face ID, huella dactilar).

**Clase WebAuthnError:** códigos tipados: `NOT_SUPPORTED`, `USER_CANCELLED`, `NO_CREDENTIALS`, `INVALID_STATE`, `NETWORK_ERROR`, `PARSE_ERROR`, `UNKNOWN`, `NO_RESPONSE`.

La conversión base64 ↔ ArrayBuffer se hace con `base64ToUint8Array()` y `arrayBufferToBase64()`.

### Login de administrador

`POST /admin/login` retorna `{ rol }`. Mapeo de roles a rutas:

| rol | Ruta de destino |
|-----|----------------|
| `administrador` | `/administrador` |
| `administrador_bomberman` | `/administrador_bomberman` |
| `administrador_ambas` | modal de elección |
| `registros_diarios` | `/registros_diarios_admin` |
| `sst` | `/eleccion_sst` |

### Identificación de empresa

`empresaFromId(id)` en `CedulaIngreso.jsx`:
```
1 → 'GyE'      (Gruaman)
2 → 'AIC'      (Bomberman)
3 → 'Tecnicos'
4 → 'SST'
5 → 'Lideres'
```

---

## 12. Geolocalización

La validación de presencia en obra ocurre en `BienvenidaSeleccion.jsx`.

### Flujo

1. Al seleccionar una obra del datalist, se llama `requestGPS()` de forma anticipada.
2. `requestGPS()` llama `navigator.geolocation.getCurrentPosition()` con:
   - `enableHighAccuracy: true`
   - `timeout: 12000ms`
   - `maximumAge: 0` (siempre coordenadas frescas)
3. Estado GPS: `idle` → `cargando` → `ok | error`.
4. Al presionar "Empecemos" → `validarYNavegar(coords)`:
   - `POST /validar_ubicacion` con `{ obra_id, lat, lon }`.
   - Respuesta `{ ok: true }` → navega.
   - Respuesta `{ ok: false, distancia }` → muestra mensaje con distancia (en metros si < 1000, en km si ≥ 1000).
5. Si coordenadas no disponibles al presionar el botón: las solicita en el momento y reintenta.

### Tolerancia

El backend valida que la distancia sea menor a **500 metros** del punto central de la obra.

### Fallback

Si el dispositivo no soporta geolocalización (`!navigator.geolocation`) → error claro al usuario. Si el GPS falla → botón "Reintentar GPS".

---

## 13. Firma digital (Signio)

La integración con Signio se referencia en los formularios de firma dentro de los componentes de formulario, pero la lógica de firma digital no está presente en el código del frontend actual explorado. Los formularios como `permiso_trabajo.jsx` incluyen campos de firma que se capturan y envían al backend, el cual invoca la API de Signio para generar el documento firmado.

El frontend no consume directamente la API de Signio; delega esa responsabilidad al backend.

---

## 14. Utilidades y helpers

### src/utils/api.js

Instancia central de Axios. Todos los módulos deberían importar esta instancia.

```js
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || 'https://gruaman-bomberman-back.onrender.com';

const api = axios.create({ baseURL: API_BASE_URL });
export default api;
```

### src/utils/dateUtils.js

| Función | Descripción |
|---------|-------------|
| `toYMD(date)` | Convierte a `YYYY-MM-DD` usando zona Colombia. Evita desfase UTC. |
| `getCurrentWeekKey()` | Retorna `YYYY-WN` (semana del año) para claves de localStorage semanal. |
| `isSunday()` | Retorna `true` si hoy es domingo (día de reset semanal). |
| `todayStrBogota()` | Retorna `YYYY-MM-DD` en zona `America/Bogota`. |

### src/utils/formParser.js

Motor central de la FASE 6. Ver sección 9 para documentación detallada.

Funciones exportadas:
- `parseFormToQuestions(worldId)` → `Section[] | null`
- `convertAnswersToFormData(worldId, answers)` → payload para el backend
- `submitFormData(worldId, answers)` → `Promise<void>`

### src/utils/questionTypes.js

Configuración de timers para secciones gamificadas.

```js
export const TIMER_CONFIG = {
  epp:      { duration: 90,  bonusThreshold: 60  },
  srpdc:    { duration: 120, bonusThreshold: 90  },
  revision: { duration: 180, bonusThreshold: 120 },
  sistemas: { duration: 150, bonusThreshold: 100 },
};

export function getTimerConfig(sectionId) { ... }
```

### src/hooks/useFormGenerales.js

Hook personalizado que resuelve los datos del formulario desde localStorage y la API:

```js
const { nombre_proyecto, nombre_operador, cargo, fechaHoy, constructora, cargando }
  = useFormGenerales();
```

Llama `GET /obras` para obtener la constructora del proyecto activo. Fallback a string vacío si la llamada falla.

### src/db/gameProgress.js

Gestión de sesión de progreso de juego.

Funciones exportadas:
- `getCompletedWorlds()` → `string[]`
- `markWorldComplete(worldId)` → crea sesión si no existe, idempotente
- `isWorldComplete(worldId)` → `boolean`
- `getSessionMinutesLeft()` → minutos restantes o `null`
- `computeWorldStatus(world, completedIds, allWorlds)` → estado del nodo

### src/config/gameConfig.js

Configuración estática de todos los mundos y funciones de consulta.

Funciones exportadas:
- `getWorldsByCharacter(character)` → todos los mundos
- `getDailyWorlds(character)` → solo mundos con `daily !== false`
- `getWorldById(character, worldId)` → un mundo específico
- `isSharedWorld(worldId)` → `boolean`
- `getCharacterColor(character)` → tokens de color
- `getCharacterName(character)` → nombre de display
- `determineCharacter(empresa)` → `'gruaman'` o `'bomberman'`
- `calculateProgress(completed, total)` → porcentaje

### src/pushNotifications.js

`subscribeUser(numeroIdentificacion)` — Obtiene clave VAPID, crea suscripción push y la envía al backend. Todos los errores se silencian (la suscripción no es crítica).

### src/components/webauthn.js

`checkWebAuthnSupport()`, `registerWebAuthn({ numero_identificacion, nombre })`, `authenticateWebAuthn({ numero_identificacion })`, clase `WebAuthnError`.

---

## 15. Formularios del dominio

### Compartidos (Gruaman + Bomberman)

#### Permiso de Trabajo (`permiso_trabajo.jsx`)

Formulario de 8+ secciones:
1. **Datos generales**: cliente, proyecto, fecha, operador.
2. **Tareas a realizar**: checkboxes de tipo de tarea (izaje, bombeo, etc.).
3. **Herramientas**: lista de herramientas con checkboxes.
4. **Trabajadores**: tabla de trabajadores con cargo, cédula, empresa.
5. **EPP / SRPDC**: checklists de equipos de protección.
6. **Equipos de acceso**: tipos de acceso (escalera, andamio, etc.).
7. **Medidas de prevención**: verificaciones de seguridad.
8. **Cierre / Firma**: hora de cierre + campo de firma Signio.

Persistencia semanal con `getCurrentWeekKey()`.
Endpoint: `POST /compartido/permiso_trabajo`.

#### Chequeo de Alturas (`chequeo_alturas.jsx`)

5 categorías de preguntas Sí/No/NA (mostradas como radio buttons):
1. Condiciones de salud (4 preguntas).
2. Condiciones generales de seguridad (10 preguntas).
3. Sistema de acceso y punto de anclaje (2 preguntas).
4. Izaje de cargas (4 preguntas).
5. Intervención del riesgo eléctrico (8 preguntas).

Endpoint: `POST /compartido/chequeo_alturas`.

#### Hora de Ingreso (`horada_ingreso.jsx`)

Captura automática de hora actual del dispositivo al tocar el botón. Registra `hora_ingreso` en formato `HH:MM`.
Endpoint: `POST /compartido/hora_ingreso`.

#### Hora de Salida (`hora_salida.jsx`)

Similar a hora de ingreso. Registra `hora_salida`.
Endpoint: `POST /compartido/hora_salida`.

---

### Gruaman

#### Chequeo Torre Grúas (`chequeo_torregruas.jsx`)

3 secciones:
1. Condiciones de seguridad personal (EPP, EPCC, ropa).
2. Controles operacionales (13 puntos: tornillería, cables, frenos, poleas, gancho, mando).
3. Elementos de izaje (6 puntos: baldes, canastas, estrobos, grilletes, radio).

Endpoint: `POST /gruaman/chequeo_torregruas`.

#### Chequeo Elevador (`chequeo_elevador.jsx`)

3 secciones análogas a torregrúas pero para elevador de carga.
Endpoint: `POST /gruaman/chequeo_elevador`.

#### Inspección EPCC (`inspeccion_epcc.jsx`)

Inspección de equipos de protección contra caídas.
Endpoint: `POST /gruaman/inspeccion_epcc`.

#### Inspección Izaje (`inspeccion_izaje.jsx`)

Control de equipos de izaje (eslingas, grilletes, ganchos, baldes, canastas).
Endpoint: `POST /gruaman/inspeccion_izaje`.

#### ATS — Análisis de Trabajo Seguro

8 tipos de ATS, cada uno con sus pasos específicos embebidos en `formParser.js`:

| worldId | Nombre |
|---------|--------|
| `ats-operacion-torregrua` | Operación de Torre Grúa (4 pasos) |
| `ats-mando-inalam` | Torre Grúa Mando Inalámbrico (4 pasos) |
| `ats-montaje-torregrua` | Montaje de Torre Grúas (4 pasos) |
| `ats-montaje-elevador` | Montaje Elevador de Carga (7 pasos) |
| `ats-desmontaje-torregrua` | Desmontaje Torre Grúa (6 pasos) |
| `ats-telescopaje` | Telescopaje (9 pasos) |
| `ats-mantenimiento` | Mantenimiento General (6 pasos) |
| `ats-elevador` | Elevador de Carga (3 pasos) |

Todas incluyen secciones comunes de riesgos, herramientas y EPP antes de los pasos específicos.
Endpoint: `POST /gruaman/ats`.

---

### Bomberman

#### Planilla de Bombeo (`planillabombeo.jsx`)

Formulario especial con sub-registros de remisiones. **No gamificable**. Permite agregar múltiples remisiones de concreto con datos de volumen, hora, resistencia, etc.
Endpoint: `POST /bomberman/planilla_bombeo`.

#### Checklist Bomba (`checklist.jsx`)

Checklist de revisión completa del equipo de bombeo. **Dinámico por cargo**: operario ve chasis y lubricación; auxiliar ve sistema hidráulico, eléctrico y tubería. ~130 ítems organizados en 8 secciones.
Endpoint: `POST /bomberman/checklist`.

#### Inspección EPCC Bomberman (`inspeccion_epcc_bomberman.jsx`)

Similar a EPCC Gruaman pero con campos específicos para equipos de bombeo.
Endpoint: `POST /bomberman/inspeccion_epcc`.

#### Inventarios Obra (`inventariosobra.jsx`)

Inventario mensual de materiales y herramientas. Se reinicia el primer día de cada mes.
Endpoint: `POST /bomberman/inventarios_obra`.

#### Herramientas Mantenimiento (`herramientas_mantenimiento.jsx`)

Control de herramientas de mantenimiento preventivo.
Endpoint: `POST /bomberman/herramientas_mantenimiento`.

#### Kit Limpieza (`kit_limpieza.jsx`)

Control de kit de lavado y mantenimiento de la bomba.
Endpoint: `POST /bomberman/kit_limpieza`.

---

### SST

#### PQR (`pqr.jsx`)

Formulario de Peticiones, Quejas y Reclamos.

#### Hallazgos (`hallazgos.jsx`)

Reporte de hallazgos de seguridad.

#### Acta Visita Grúa / Elevador

Actas de visita técnica para grúas y elevadores.

---

## 16. Responsive y mobile-first

### Estrategia

La app es **mobile-first**: se diseña para pantallas de 320px hacia arriba. El viewport target principal es un smartphone en modo retrato.

### Clases utilitarias (App.css / formulario1.css / permiso_trabajo.css)

Las clases de formulario clásico tienen anchos máximos:
- `.card-section`, `.form-container` → centrados con `max-width` y padding lateral.
- `.input`, `.button` → `width: 100%` con `max-width` variable.
- `.permiso-trabajo-btn` → `min-height: 44px` (tamaño mínimo táctil).

### Breakpoints en componentes

Los componentes detectan el viewport directamente con `window.matchMedia`:

```js
// Mobile: < 600px
useIsMobile() → window.matchMedia("(max-width: 599px)")

// Landscape en mobile: orientation landscape AND max-height 500px
useIsLandscape() → window.matchMedia("(orientation: landscape) and (max-height: 500px)")
```

- `SOSButton`, `STOPButton`, `InstallPWAButton`: visibles solo en `isMobile`.
- `BienvenidaSeleccion`: ajusta layout en `isLandscape` (reduce padding, quita GIF de fondo).
- `CedulaIngreso`: en landscape cambia layout vertical a horizontal para acomodar el formulario.

### Sistema de juego (landscape obligatorio)

El flujo de juego (`GameFlow`, `WorldMap`, `LevelWrapper`) requiere orientación horizontal. `RotateScreen` muestra una instrucción de rotar el dispositivo. `OrientationLock` (CSS) puede bloquear la orientación si el navegador lo permite.

### Tailwind en componentes de juego

Los componentes de la carpeta `game/` usan clases CSS propias (no Tailwind), definidas en archivos `.css` co-localizados. El sistema de juego tiene su propio design system visual con variables CSS (`--wn-color`, `--wn-bg`).

---

## 17. Patrones y convenciones

### Nombrado

| Tipo | Convención | Ejemplos |
|------|------------|---------|
| Componentes React | PascalCase | `QuestionWrapper`, `WorldMap` |
| Archivos de componentes | lowercase_snake o kebab | `permiso_trabajo.jsx`, `eleccionaic.jsx` |
| Hooks personalizados | camelCase con prefijo `use` | `useFormGenerales`, `useIsMobile` |
| Funciones utilitarias | camelCase | `getGameContext`, `todayStrBogota` |
| Constantes | UPPER_SNAKE_CASE | `API_BASE_URL`, `TIMER_CONFIG`, `CHECKLIST_ITEM_ROLES` |
| IDs de mundo | kebab-case | `permiso-trabajo`, `chequeo-torregruas` |
| IDs de campo backend | snake_case | `nombre_operador`, `epp_personal` |

### Estructura de archivos

- Los componentes de formulario y sus tests están en la misma carpeta por dominio (`gruaman/`, `bomberman/`, `compartido/`).
- Cada componente de juego tiene su CSS co-localizado (`QuestionWrapper.css` junto a `QuestionWrapper.jsx`).
- No hay barrels (`index.js`) — las importaciones son directas a la ruta del archivo.

### Patrones recurrentes

**Datos de localStorage en formularios:**
Todos los formularios que necesitan datos del contexto (operador, proyecto, cliente) los leen directamente de localStorage en el cuerpo del componente o en un `useEffect`. El hook `useFormGenerales` centraliza este patrón para componentes nuevos.

**Reset diario de uso:**
Los menús de selección (`eleccion.jsx`, `eleccionaic.jsx`, etc.) detectan cambio de día comparando la fecha guardada en localStorage con la fecha actual en zona Bogotá. Adicionalmente, programan un `setTimeout` hasta la medianoche para el reset automático.

**Persistencia semanal en formularios:**
Varios formularios guardan respuestas con `getCurrentWeekKey()` como parte de la clave de localStorage. Los domingos, `isSunday()` devuelve `true` y los formularios limpian los datos previos.

**Botones de opciones grandes:**
Los formularios usan `min-height: 44px` en todos los controles interactivos para facilitar el uso en pantallas táctiles.

**Manejo de errores asíncronos:**
```js
try {
  const resp = await axios.post(url, payload);
  // ... éxito
} catch (err) {
  const mensaje = err.response?.data?.error || 'Error al enviar.';
  setError(mensaje);
}
```

**Estado vacío / cargando:**
Los paneles de administración siempre muestran un estado de carga (`loading === true` → spinner/mensaje) y un estado vacío cuando no hay registros.

---

## 18. Flujos de usuario principales

### Flujo de ingreso a la obra (modo juego)

```
Usuario abre la app
       │
       ▼
  IntroVideo (intro.mp4, máx 6s)
       │
       │ [video termina o timeout]
       ▼
  CedulaIngreso
  ├─ Escribe cédula
  ├─ GET /datos_basicos → busca trabajador activo
  ├─ WebAuthn? → biometría / PIN
  └─ onUsuarioEncontrado(usuario)
       │
       ▼
  BienvenidaSeleccion
  ├─ GET /obras → lista obras activas
  ├─ Selecciona obra → GPS automático
  ├─ Botón "Empecemos" → POST /validar_ubicacion
  └─ Distancia OK (< 500m)
       │
       ├─ empresa ∈ {GyE, AIC} && !lite_mode
       │       ▼
       │  /game/rotate-screen  (GameFlow step=rotate)
       │       │
       │       ▼
       │  /game/story-intro   (GameFlow step=story)
       │       │
       │       ▼
       │  /game/world-map     (WorldMap)
       │
       └─ empresa ∉ {GyE, AIC} || lite_mode
               ▼
          /eleccion | /eleccionaic | /eleccion_sst | ...
```

### Flujo de completar una misión gamificada

```
WorldMap
  │
  │ [tap en nodo desbloqueado]
  ▼
CircleTransition (out)
  │
  ▼
/game/level/:worldId  →  LevelWrapper
  │
  ├─ parseFormToQuestions(worldId) retorna Section[]
  │       │
  │       ▼
  │  QuestionWrapper (sección 0)
  │  ├─ pregunta 1 → flip → MicroCelebration → pregunta 2 → ...
  │  ├─ handleAnswer almacena en answersRef
  │  └─ onComplete(sectionAnswers) → LevelWrapper.handleSectionComplete
  │       │
  │       ├─ No es última sección → sectionIdx++
  │       │       └─ QuestionWrapper (sección siguiente)
  │       │
  │       └─ Es última sección
  │               │
  │               ▼
  │         submitFormData(worldId, allAnswers)
  │               │
  │               ├─ OK → markWorldComplete(worldId)
  │               │     → limpiar sessionStorage
  │               │     → setTimeout(navigate /game/world-map, 1800ms)
  │               │
  │               └─ Error → mostrar botón reintento
  │
  └─ parseFormToQuestions(worldId) retorna null
          │
          ▼
     Suspense → FormComponent original
          │
          └─ Formulario escribe game_mode en localStorage
             WorldMap al volver detecta game_mode y marca completo
```

### Flujo de misión con formulario original (no gamificada)

```
LevelWrapper
  │
  ├─ isGamified = false
  ▼
React.lazy(() => import(FORM_MAP[worldId]))
  │
  ▼
FormComponent montado dentro de LevelWrapper
  │
  │ [usuario llena y envía el formulario]
  │ FormComponent hace POST al backend
  │ Al terminar: localStorage.setItem('game_mode', worldId)
  │              navigate('/eleccion') o navigate(-1)
  │
  ▼
WorldMap se monta
  │
  ├─ useEffect lee localStorage.game_mode
  ├─ markWorldComplete(worldId)
  └─ setCompletedIds(getCompletedWorlds())
```

### Flujo de login de administrador

```
CedulaIngreso
  │
  │ [toca botón admin (esquina inferior)]
  ▼
Modal de contraseña
  │
  ├─ POST /admin/login { password }
  │
  ├─ rol = 'administrador'        → navigate('/administrador')
  ├─ rol = 'administrador_bomberman' → navigate('/administrador_bomberman')
  ├─ rol = 'registros_diarios'    → navigate('/registros_diarios_admin')
  ├─ rol = 'administrador_ambas'  → modal de elección de empresa
  └─ rol = 'sst'                  → navigate('/eleccion_sst')
```

### Flujo de SOS desde campo

```
[Usuario en cualquier pantalla mobile]
  │
  │ [toca botón rojo SOS]
  ▼
Modal: ¿Llamar o Escribir mensaje?
  │
  ├─ Llamar → tel:573183485318
  │
  └─ Escribir mensaje
          │
          ├─ [modal ¿Bomberman o Gruaman?]
          │
          ├─ Gruaman → handleRegion(URL Gruaman WA)
          │             → clipboard.writeText(mensaje SOS)
          │             → window.location.href = URL
          │
          └─ Bomberman → [modal: Cundinamarca / Antioquia / Atlántico]
                          → handleRegion(URL regional)
                          → clipboard.writeText(mensaje SOS)
                          → window.location.href = URL
```

### Diagrama de flujo de autenticación WebAuthn

```
checkWebAuthnSupport()
  │
  ├─ false → Flujo PIN
  │    ├─ GET /datos_basicos → buscar usuario con pin_hash
  │    ├─ Sin PIN → modal crear PIN
  │    │    └─ POST /trabajadores/:id/pin/setup
  │    └─ Con PIN → modal verificar PIN
  │         └─ POST /trabajadores/:id/pin/verify
  │
  └─ true → Flujo WebAuthn
       ├─ POST /webauthn/register/options → tiene excludeCredentials?
       │    ├─ Sí (ya registrado) → flujo authenticate
       │    └─ No → navigator.credentials.create() → POST /webauthn/register/verify
       └─ POST /webauthn/authenticate/options
            └─ navigator.credentials.get() → POST /webauthn/authenticate/verify
```

---

*Documentación generada  a partir del código fuente.*
