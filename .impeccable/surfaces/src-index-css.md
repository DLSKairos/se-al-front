---
version: 1
slug: "src-index-css"
primary_target: "src/index.css"
related_targets: []
---

## Scope
Todo el producto web (Operate). Foco de esta pasada: sistema de tokens, componentes base, layouts, login, operador, modo juego. Admin hereda tokens.

## Direction contract
THESIS: La señalética de seguridad de obra (ISO 7010 / ANSI Z535) es el sistema de la app: la forma, el color y el pictograma de un cartel dicen el estado antes que el texto. Rechaza el dashboard oscuro con neón cian y el cosmos del juego.
OWN-WORLD: Base grafito cálido (#1B1A17 oscuro / #F4F2EC claro, hueso de cemento), amarillo seguridad #FFC400 como único color de acción, tinta #14130F sobre amarillo. Estados ISO: verde seguridad #00873C, rojo prohibición #D6261E, naranja advertencia #E8650A, azul obligación #0A5FB4. Tipografía Barlow Condensed (títulos, cifras) y Barlow (UI). Radios de 6 a 14px, bordes de 1.5px de tinta, cinta de precaución diagonal como único ornamento. Vidrio líquido solo en capas flotantes (barra inferior, hojas, HUD).
STORY: El obrero entiende en un vistazo qué le falta por hacer hoy, lo hace con un pulgar enguantado y recibe confirmación inmediata; el admin ve el mismo lenguaje en su panel.
FIRST VIEWPORT: Inicio del operador en móvil: saludo con cargo y obra en título condensado, un cartel de estado de la jornada (asistencia) como acción principal amarilla de 64px de alto, lista de formularios como filas grandes con pictograma de estado, barra inferior de vidrio con 4 destinos. Modo juego: mapa como diagrama de ruta (líneas a 45/90 grados) con estaciones con forma de cartel ISO.
FORM: candidato 7 de mi lista (sistema ISO 7010 de señalética) con raise del diagrama de ruta de tránsito nocturno (disciplina de ángulos y estaciones de intercambio). seed: seed:cbad42522a238a93
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
