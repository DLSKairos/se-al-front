# Design — SEÑAL

Sistema de señalética de seguridad de obra (ISO 7010 / ANSI Z535). La forma, el color y el pictograma dicen el estado antes que el texto.

## Color (tokens en `src/index.css`)
- Claro: bg `#F3F1EA`, surface `#FFFFFF`, fg `#17160F`, muted `#5B584B`.
- Oscuro (automático por sistema, o `data-theme`): bg `#141310`, surface `#1E1D18`, fg `#F4F1E8`.
- Acción: `--brand` `#FFC400`, texto sobre marca `--on-brand` `#17160F`. Texto de acento: `--accent-ink`.
- Estados: ok `#00873C`, danger `#D6261E`, warn `#E8650A`, info `#0A5FB4`, con variantes `-ink` por tema.
- Los alias heredados (`--navy`, `--signal`, `--off-white`, `--muted`) y las paletas Tailwind red/emerald/amber/blue apuntan a estos tokens.

## Tipografía
Barlow Condensed (títulos, cifras, carteles) y Barlow (UI), autoalojadas con @fontsource. Mínimo 12px; cuerpo 16–18px.

## Forma y profundidad
Objetivos táctiles de 44–72px. Radios 12–28px. Paneles sólidos (`.glass`, `.glass-card`); vidrio líquido (`.liquid`) solo en capas flotantes: barra inferior, hojas, toasts, HUD del juego. Único ornamento: cinta de precaución (`.hazard`).

## Estado = forma
Cuadrado verde = hecho; círculo amarillo = siguiente; círculo claro = pendiente; triángulo = atención; círculo rojo = problema (ver `Badge`).

## Modo juego
"Ruta de la jornada": camino con giros de 45°/90° y estaciones con forma de cartel (`WorldMap.tsx`, `styles/game.css`).
