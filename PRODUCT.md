# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Operadores de campo (obreros, personal de obra): usan la app en el celular, a pleno sol, con guantes o manos sucias, en túneles o de noche, a menudo con conexión degradada. Llenan formularios de seguridad, registran asistencia y firman actas. Administradores de organización crean formularios, revisan reportes y gestionan usuarios y ubicaciones desde escritorio. Super admins gestionan organizaciones multi-tenant.

## Product Purpose
SEÑAL es un SaaS de gestión operativa y seguridad laboral de Kairos. Digitaliza formularios, asistencia, inventarios, permisos y firmas en campo, y convierte el llenado de formularios en un "modo juego" para que el obrero responda con atención. Éxito: el obrero completa su formulario correcto sin ayuda, y el admin ve datos confiables.

## Positioning
Formularios de seguridad llenados como niveles de un mapa (modo juego), con asistencia, firma con evidencia y PWA offline en un mismo producto para obra.

## Operating Context
PWA instalable con service worker, push notifications, WebAuthn o PIN, detección de conexión lenta (modo lite), IndexedDB (Dexie) para el progreso del juego. Roles: OPERATOR, ADMIN, SUPER_ADMIN. UI en español.

## Capabilities and Constraints
Stack: React 19, TypeScript, Vite, Tailwind 4, Framer Motion, Zustand, TanStack Query. Tipos en `src/types/index.ts`, query keys en `src/lib/queryKeys.ts`. AdminChatPage es una feature futura: no implementar funcionalidad nueva ahí. El nombre anterior "La Central" está descartado. En respuestas de formularios se muestra `field.label`, nunca `field_id`. No cambiar contratos de API ni lógica de negocio.

## Brand Commitments
Nombre SEÑAL (con Ñ). Marca de Kairos. La paleta anterior (navy + cian + ámbar) queda como evidencia, no como obligación: el usuario pidió explícitamente una paleta nueva.

## Product Principles
1. El obrero primero: objetivos táctiles grandes, texto legible al sol, una acción clara por pantalla.
2. Señalética, no decoración: el color comunica estado (peligro, atención, correcto) como en la obra real.
3. El juego sirve al formulario: la gamificación nunca entorpece ni oculta la respuesta de seguridad.
4. Funciona con mala conexión y con guantes.

## Accessibility & Inclusion
Contraste mínimo 4.5:1 en texto, objetivos táctiles de al menos 48px, respeto de prefers-reduced-motion, no depender solo del color para estados (icono + texto). Tema claro por defecto con oscuro automático según el sistema.
