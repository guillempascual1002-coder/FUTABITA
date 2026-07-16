# FUTABITA — Contexto del proyecto para Claude Code

## Qué es esto

App de tracking de hábitos personales (gimnasio, comida, sueño) con temática de **modo carrera de fútbol estilo FIFA**. El usuario (GUILLEM) sube stats de una carta de jugador (FIS, FUE, RES, NUT, REC, MEN) cumpliendo objetivos reales de vida, y en paralelo vive una carrera futbolística simulada: ficha por clubes, juega partidos, asciende de categoría, recibe mensajes de personajes del vestuario, etc.

Es un proyecto **personal, de un único usuario**, sin backend de datos ni multiusuario. Todo el estado del juego vive en el navegador del propio usuario.

## Stack técnico

- **React 18 + Vite 5** (sin TypeScript, JSX plano)
- Un único componente gigante en `src/App.jsx` (~1470 líneas) que contiene TODO: lógica de juego, todos los subcomponentes, estilos CSS-in-JS (etiqueta `<style>` al final vía `StyleTag()`), simulador de partidos, etc. No está modularizado en archivos separados — así ha evolucionado por iteraciones rápidas en Claude.ai y así sigue por ahora. Se puede dividir en el futuro pero no es prioritario.
- **Sin backend de base de datos.** Persistencia 100% en `localStorage` del navegador (funciones `stGet`/`stSet`, líneas ~136-137), bajo el prefijo `"futabita:"`. NO usar cookies, NO usar IndexedDB salvo que se decida migrar explícitamente.
- **PWA**: instalable a pantalla de inicio (manifest.json + service worker en `public/sw.js`, estrategia network-first con fallback a caché).
- **Despliegue en Vercel**, repo GitHub `guillempascual1002-coder/FUTABITA`, proyecto Vercel llamado `futtabita` (con doble T, ojo — nombre legacy por conflicto de nombre al crearlo, no coincide con el nombre del repo ni con el título mostrado en la app).
- **Función serverless** en `api/estimate.js`: estimación de kcal/proteína de comidas por IA (Claude vía Anthropic API). **Desactivada por defecto** — si no hay `ANTHROPIC_API_KEY` en las env vars de Vercel, devuelve 501 y el frontend cae automáticamente a entrada manual de comidas. No asumir que la IA está activa salvo que el usuario confirme que puso la clave.

## Estructura de archivos

```
index.html          → HTML raíz, carga fuentes Google (Oswald + Barlow), monta #root
src/main.jsx         → Punto de entrada, createRoot + registro del service worker
src/App.jsx          → TODO el juego (ver mapa de componentes abajo)
public/manifest.json → Metadata PWA (nombre, iconos, colores)
public/sw.js          → Service worker (cache-first para assets, red directa para /api/)
public/icon-192.png, icon-512.png → Iconos generados (balón dorado sobre fondo oscuro #0a0e1a)
api/estimate.js       → Función serverless Vercel, llama a Anthropic API, oculta la key
vercel.json           → Config de build + rewrite SPA (todo lo que no sea /api/* cae a index.html)
vite.config.js        → Config estándar de Vite + plugin React
package.json          → Dependencias: react, react-dom, vite, @vitejs/plugin-react
```

## Mapa de `src/App.jsx` (por si hay que localizar algo rápido)

**Constantes y datos de juego** (líneas ~1-120): stats, pesos de OVR, posiciones, pool de clubes regionales, capitanes, plantillas de mensajes de prensa/entrenador/capitán.

**Funciones puras de lógica de juego**:
- `formFromPct` — convierte % de cumplimiento diario en forma (`alza`/`buen`/`est`/`caida`)
- `dayPct` — calcula el % de un día según objetivos vs. lo registrado
- `applyDayClose` — cierra un día: aplica multiplicador de forma a la XP, gestiona racha/decaimiento, sube stats si toca
- `simulateMatch` — simulador de partidos (rating según forma + stats)
- `calcOVR`, `xpToNext`, `cardTier`, `marketValue` — fórmulas de progresión
- `sanitizeGame` — repara datos heredados corruptos (NaN, nulls) al cargar partida vieja

**Componentes de UI** (todos como funciones dentro del mismo archivo):
- `PlayerCard` — la carta estilo FIFA
- `IntroScreen`, `Onboarding`, `ChoiceScreen`, `SigningOverlay` — flujo inicial de creación de personaje/fichaje
- `MatchModal` — modal de resultado de partido con eventos
- `ChatTab` — bandeja de mensajes estilo WhatsApp (entrenador, capitán, prensa)
- `MonthCal` — calendario mensual para ver/editar días pasados
- `LogTab` — pantalla de registro diario (comidas, gym, sueño, hábitos)
- `LeagueTab` — clasificación y calendario de liga
- `HomeTab` — pantalla de inicio con resumen
- `BackupPanel`, `ProfileTab` — pestaña "Yo": edición de objetivos, hábitos, pesaje, respaldo/restauración
- `export default function App()` (línea ~1048) — componente raíz, estado global del juego, tabs, orquestación
- `StyleTag` (línea ~1382, final del archivo) — todo el CSS de la app en una plantilla literal

## Reglas de diseño ya decididas (no cambiar sin que el usuario lo pida)

1. **La forma del jugador (la que afecta a partidos) solo cambia al CERRAR un día**, nunca en vivo mientras registras algo hoy. Esto se decidió expresamente tras un bug — no revertir a recalcular en vivo.
2. **Ventana de gracia de 1 día**: el día de ayer queda editable/pendiente de cierre hasta que pasen 2 fechas o el usuario lo cierre a mano. Los partidos ya simulados NUNCA se recalculan aunque edites un día pasado.
3. **Multiplicadores de XP por forma del día**: alza ×1.5, buen ×1, est ×0.35, caída ×0. Salvo XP "pasiva" de MEN (constancia de uso) que es inmune a este multiplicador.
4. Migración de partidas: el sistema de respaldo (JSON pegado a mano, botón copiar/pegar en Yo) es el mecanismo oficial de portar datos entre versiones. Mantenerlo funcionando siempre, con **validación de JSON antes de aceptar restauración**.

## Convenciones de estilo de código

- Comentarios y strings de UI en **español** (el usuario es hispanohablante, la app es en español).
- Nombres de variables y funciones en inglés/camelCase salvo constantes de datos de juego que pueden llevar términos en español si son literales de contenido (mensajes, nombres de clubes).
- Tipografías: `'Oswald'` para títulos/UI de labels, `'Barlow'` para texto de cuerpo.
- Paleta: fondo oscuro `#0a0e1a`/`#12182a`, dorado acento `#C9A94E`/`#E8C15A`, texto claro `#F5EFDF`.
- Los toasts de feedback usan `pushToast(...)`.

## Cómo iterar en este proyecto

1. Los cambios se hacen directamente en `src/App.jsx` (o el archivo que corresponda).
2. Antes de dar algo por bueno, **compilar con `npm run build`** para pillar errores de sintaxis JSX — el proyecto no tiene tests automatizados, la compilación es la única red de seguridad rápida.
3. Al hacer push a `main` en GitHub, Vercel redespliega automáticamente. Si el deploy no salta solo, se puede forzar desde el panel de Vercel (Deployments → ⋯ → Redeploy).
4. El usuario prueba en su móvil (PWA instalada) y su fuente de verdad para depurar son sus datos reales de partida — cualquier cambio en la estructura del JSON de guardado debe ser retrocompatible o venir con instrucciones claras de migración del respaldo.
5. No añadir dependencias nuevas sin necesidad real — el proyecto se ha mantenido deliberadamente ligero (solo react + react-dom en producción).

## Lo que el usuario ha pedido para el futuro cercano (aún no implementado)

- Subir/quitar una imagen de escudo personalizado para su club (como ya existe para la foto de perfil), opción en la pestaña Yo.
- Rechazadas explícitamente por el usuario: partido diario (rompe el ritmo de progresión de temporada), logros/trofeos, cartas con bordes por rango, sistema de rivalidades especiales, estimación de comida por foto. Si en el futuro se retoma alguna de estas, confirmar con el usuario que ha cambiado de opinión antes de implementarla.
