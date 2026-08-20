# AGENTS.md — SEÑAL Frontend

## Descripción del proyecto

**SEÑAL** es un SaaS de gestión operativa y seguridad laboral desarrollado por Kairos. Anteriormente se llamaba "La Central" — ese nombre está completamente descartado, no hay referencias a él en el código ni en los mensajes.

La app tiene tres roles principales con interfaces distintas:

- **OPERATOR** — Empleados de campo. Llenan formularios, registran asistencia, ven su perfil.
- **ADMIN** — Administradores de organización. Crean formularios, ven reportes, gestionan usuarios/ubicaciones.
- **SUPER_ADMIN** — Control total multi-tenant. Gestiona organizaciones.

---

## Stack

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19.1.1 | Framework UI |
| TypeScript | 6.0.2 | Tipado |
| Vite | 7.1.2 | Build + dev server (puerto 4000) |
| React Router | 7.8.2 | Routing |
| Zustand | 5.0.12 | Estado global (auth, form editor) |
| TanStack Query | 5.96.2 | Estado del servidor / caché |
| Tailwind CSS | 4.1.14 | Estilos |
| Axios | 1.11.0 | HTTP client |
| Framer Motion | 12.34.5 | Animaciones |
| DnD Kit | 6.3.1 | Drag & drop en el editor |
| Dexie | 4.3.0 | IndexedDB para progreso del juego |
| Vitest | 4.1.5 | Tests unitarios |
| Playwright | 1.59.1 | Tests e2e |
| MSW | 2.13.6 | Mock API en tests |

---

## Estructura del proyecto

```
src/
├── components/
│   ├── form-editor/    # Editor visual de formularios (canvas, AI panel, save drawer)
│   ├── forms/          # Renderizado dinámico de formularios y campos
│   ├── game/           # Componentes del modo juego (mapa, niveles, preguntas)
│   ├── layout/         # Layouts por rol (AdminLayout, OperatorLayout, SuperAdminLayout)
│   └── ui/             # Componentes compartidos (Button, Modal, Toast, etc.)
├── pages/
│   ├── admin/          # 18 páginas del panel admin
│   ├── operator/       # 5 páginas del operador
│   ├── super/          # 3 páginas del super admin
│   └── login/          # LoginPage (WebAuthn + PIN)
├── stores/
│   ├── authStore.ts    # JWT + usuario + workLocationId (persiste en localStorage)
│   └── formEditorStore.ts  # Estado del editor (secciones, campos, dirty flag)
├── lib/
│   ├── api.ts          # Instancia Axios + todos los endpoints
│   ├── queryKeys.ts    # Claves de React Query
│   ├── utils.ts        # Helpers generales
│   ├── fieldToQuestion.ts  # Mapea campo de formulario → pregunta del juego
│   └── webauthn.ts     # Autenticación biométrica
├── hooks/
│   ├── useAuth.ts      # Accessor del authStore
│   └── useDownload.ts  # Descarga de archivos con JWT
├── types/index.ts      # Todos los tipos/interfaces del dominio
├── utils/
│   ├── fieldType.utils.ts
│   └── formParser.ts
├── config/gameConfig.ts    # Configuración del modo juego
├── db/gameProgress.ts      # IndexedDB para progreso del juego
├── router/
│   ├── index.tsx       # Rutas (lazy-loaded)
│   └── guards/         # RoleGuard
└── main.tsx / App.tsx  # Entry points
```

---

## Autenticación

- JWT almacenado en Zustand (persistido en `localStorage` como `senal-auth`)
- Axios inyecta el token en cada request: `Authorization: Bearer <token>`
- En 401, Axios borra el auth y redirige a `/login`
- Soporte WebAuthn (biométrico) además de PIN
- `RoleGuard` en el router protege rutas por rol

---

## API

**Base URL:** `import.meta.env.VITE_API_URL` (default: `http://localhost:3000/api`)

El backend está en `/Users/david/dev/señal/señal-back`.

El wrapper de Axios en `src/lib/api.ts` desenvuelve automáticamente `{ success, data }` → retorna `data` directamente.

### Endpoints principales

**Formularios**
- `GET /form-templates` — Lista plantillas del admin
- `GET /form-templates/:id` — Plantilla con campos
- `POST /form-templates` — Crear plantilla
- `PUT /form-templates/:id` — Actualizar
- `DELETE /form-templates/:id` — Eliminar
- `POST /form-templates/:id/publish` — Activar

**Submissions**
- `GET /submissions` — Lista con filtros
- `POST /submissions` — Crear submission
- `GET /submissions/:id` — Detalle
- `PUT /submissions/:id` — Actualizar
- `POST /submissions/:id/approve` / `reject`
- `GET /submissions/stats` — Analytics

**Usuarios / Ubicaciones / Departamentos / Categorías** — CRUD estándar

**Asistencia**
- `POST /attendance/clock-in` / `POST /attendance/:id/clock-out`
- `GET /attendance/today`, `/attendance/open`, `/attendance/config`

**IA**
- `POST /form-ai/extract-from-file` — OCR → campos
- `POST /form-ai/generate-from-description` — Texto → plantilla
- `POST /form-ai/assist` — Chat asistente en el editor
- `POST /form-ai/admin-chat` — Chat del panel admin (feature futura, no implementada en UI aún)

**Blueprints / Webhooks / Auth** — ver `src/lib/api.ts`

---

## Estado global

### authStore (`src/stores/authStore.ts`)
```typescript
token: string | null
user: JWTPayload | null       // { sub, orgId, role, jobTitle, iat, exp }
workLocationId: string | null
setToken(token)
setWorkLocation(id)
clear()                       // logout
isAuthenticated(): boolean
hasRole(role): boolean
```

### formEditorStore (`src/stores/formEditorStore.ts`)
Maneja todo el estado del editor visual de formularios: secciones, campos, columnas, dirty flag, y aplicación de secciones generadas por IA.

---

## Diseño / Estilos

### Paleta de colores (Tailwind custom)
| Token | Hex | Uso |
|---|---|---|
| `navy` | `#0C1624` | Fondo principal |
| `navy-mid` | `#111E30` | Superficies secundarias |
| `navy-light` | `#162238` | Superficies terciarias |
| `signal` | `#00D4FF` | Acento primario (cyan) |
| `amber` | `#F5A623` | Acento secundario / warnings |
| `off-white` | `#F0F4F8` | Texto sobre fondos oscuros |

### Tipografía
- `syne` — Fuente principal (headings, UI)
- `fraunces` — Serif secundaria
- `dm` (DM Sans) — Técnica / monospace

### Border radius custom
- `senal` (2px), `btn` (8px), `input` (10px), `badge` (4px), `glass` (18px), `glass-md` (12px)

### Sombras custom
- `shadow-signal`, `shadow-signal-sm` — Glow cyan
- `shadow-glass` — Efecto frosted glass

---

## Rutas

### Operator (`/`)
| Ruta | Página |
|---|---|
| `/` | OperatorHomePage |
| `/form/:templateId` | FillFormPage |
| `/asistencia` | AttendancePage |
| `/perfil` | OperatorProfilePage |
| `/location-select` | LocationSelectPage |
| `/game/world-map` | WorldMap |
| `/game/level/:templateId` | LevelWrapper |

### Admin (`/admin`)
| Ruta | Página |
|---|---|
| `/admin` | AdminDashboardPage |
| `/admin/formularios` | FormTemplatesListPage |
| `/admin/formularios/nuevo` | FormCreationPathPage |
| `/admin/formularios/editor` | FormEditorPage |
| `/admin/formularios/:id/submissions` | FormSubmissionsPage |
| `/admin/submissions/:id` | SubmissionDetailPage |
| `/admin/chat` | AdminChatPage |
| `/admin/usuarios` | UsersPage |
| `/admin/ubicaciones` | WorkLocationsPage |
| `/admin/departamentos` | DepartmentsPage |
| `/admin/categorias` | CategoriesPage |
| `/admin/asistencia` | AttendanceAdminPage |
| `/admin/asistencia/configuracion` | AttendanceConfigPage |
| `/admin/configuracion` | OrgSettingsPage |
| `/admin/configuracion/webhooks` | WebhooksPage |
| `/admin/configuracion/notificaciones-push` | PushTestPage |

### Super Admin (`/super`)
| Ruta | Página |
|---|---|
| `/super` | OrganizationsPage |
| `/super/organizaciones/nueva` | CreateOrgPage |
| `/super/organizaciones/:id` | OrgDetailPage |

---

## Modo juego (Gamification)

Los formularios pueden llenarse en "modo juego": los campos se convierten en preguntas interactivas dentro de un mapa de niveles. El progreso se persiste en IndexedDB via Dexie (`src/db/gameProgress.ts`). La conversión campo→pregunta ocurre en `src/lib/fieldToQuestion.ts`.

Componentes clave en `src/components/game/`: WorldMap, LevelWrapper, GameFlow, y múltiples tipos de preguntas (TextInput, YesNo, MultiSelect, InventoryItem, TimerChallenge, etc.).

---

## PWA

- `vite-plugin-pwa` con service worker
- Push notifications (`src/pushNotifications.ts`)
- Soporte offline básico
- `SlowConnectionBanner` y `LiteModeBanner` detectan conectividad degradada
- `InstallPWAButton` para prompt de instalación

---

## Variables de entorno

```env
VITE_API_URL=https://localhost:3000/api   # URL del backend
VITE_APP_NAME=SEÑAL
VITE_APP_VERSION=2.0.0
```

---

## Tests

```bash
npm run test           # Vitest en modo watch
npm run test:run       # Vitest single run
npm run test:coverage  # Con cobertura
npm run test:e2e       # Playwright
npm run test:e2e:ui    # Playwright con UI
```

- Tests unitarios en `src/test/` con MSW para mock de API
- Tests e2e en `e2e/` con Playwright

---

## Dev

```bash
npm run dev    # Puerto 4000, HTTPS con certs locales (localhost.pem)
npm run build  # Build de producción
```

---

## Notas importantes

- **AdminChatPage** (`/admin/chat`) existe en el código pero es una feature futura. No implementar funcionalidad nueva ahí sin confirmación.
- El proyecto fue renombrado de "La Central" a "SEÑAL". No hacer referencia al nombre anterior.
- La app usa HTTPS en desarrollo (certificados locales en `localhost.pem` / `localhost-key.pem`).
- Los tipos están todos centralizados en `src/types/index.ts`.
- Las query keys de React Query están en `src/lib/queryKeys.ts` — siempre usarlas, no inventar strings sueltos.
- **`FormSubmissionValue` incluye relación `field`** — el endpoint `GET /form-submissions/:id` devuelve cada value con su campo relacionado (`field.label`, `field.field_type`). Al renderizar las respuestas de un formulario, usar `fieldValue.field?.label` como etiqueta visible, **nunca `field_id`** (es un cuid opaco, no legible).
