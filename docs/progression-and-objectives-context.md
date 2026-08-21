# FUTABITA — Contexto: progresión de carrera + qué puede detectar el motor

Documento de apoyo para diseñar misiones/capítulos implementables. Todo lo aquí
descrito es el estado REAL del código en `src/App.jsx` a fecha de este commit
(rama `narrative-rework`). No es una propuesta de diseño, es lo que el motor
ya sabe leer o hacer hoy.

---

## 1. Progresión de la carrera

### Temporadas
- `SEASON_LENGTH = 15` jornadas por temporada (≈ 2 semanas si se juega un
  partido al día). `MID_WINDOW = 8`: jornada del mercado de fichajes de
  mitad de temporada.
- `game.season = { num, startDate, matchday, table, rivals, midOfferDone }`.
  `table` es la clasificación de la liga (`{name, pts, me}` por equipo).
- 1 jornada = 1 día de calendario. Si el jugador no abre la app un día, el
  partido pendiente se acumula (nunca se salta una jornada, solo se retrasa).
- Hay exactamente **una jornada de derbi** por temporada, calculada de forma
  determinista (`derbiJornadaOf`), marcada como `m.derbi: true` en el
  historial de partidos.

### Partidos
- `playMatch()` elige rival de una lista aleatoria por tier (`RIVALS_BY_TIER`)
  y simula el partido (`simulateMatch`).
- `finishMatch()` confirma el resultado: guarda el partido en
  `game.matchHistory`, avanza `season.matchday`, actualiza la clasificación.
- Cada entrada de `matchHistory` tiene esta forma:
  ```js
  { res: "V"|"E"|"D", myGoals, myAssists, rating, benched, derbi }
  ```

### Fin de temporada / qué se puede conseguir
- Al llegar a la jornada 15: se calcula posición final, goles/asistencias de
  la temporada, mejor nota, se genera un resumen de temporada
  (`game.pendingSummary`) y se guarda en `game.careerLog`.
- **Ascenso de categoría**: 8 tiers (`TIERS`, id 0–7, de "Tercera Federación"
  a "Leyenda mundial"), cada uno con un `minOvr`. Cuando el OVR del jugador
  alcanza el `minOvr` del siguiente tier, aparecen ofertas de fichaje de
  clubes de esa categoría (a mitad de temporada y al final).
- **No existe descenso.** El tier solo puede subir. La posición final en la
  tabla es decorativa (texto de sabor), no dispara nada mecánico.
- **Fichajes/cambio de club**: aceptar una oferta (`signClub` →
  `confirmSigning`) cambia `game.club`, `game.tier`, resetea `game.season` y
  `game.squad` (vestuario nuevo). No hay contrato con duración/caducidad: un
  fichaje es permanente hasta que se acepta otra oferta.
- **Valor de mercado**: `marketValue(ovr, kgGanado)`, exponencial respecto al
  OVR, con un pequeño bonus por peso ganado desde el inicio de la carrera.
- **Titular / suplente**: existe, pero es un estado de **solo el último
  partido**, no un rol de plantilla persistente. Si la forma del jugador está
  "en caída", hay 50% de probabilidad de quedar suplente (`benched: true`,
  0 goles, nota `null` ese partido). No hay racha de partidos consecutivos
  como titular precalculada — habría que construirla a partir del historial.

### Lo que NO existe todavía (para no diseñar misiones que lo den por hecho)
- Sin lesiones.
- Sin contrato con duración/caducidad.
- Sin descenso de categoría.
- Sin identidad estable de rival (los rivales son nombres aleatorios por
  tier, no clubes fijos con los que se construye una rivalidad a lo largo de
  temporadas — salvo el derbi, que es solo una jornada marcada, no un club
  concreto).
- Sin función ya hecha de "goles/asistencias de toda la carrera" combinados
  más allá de goles (existe `careerGoals(g)`; asistencias habría que sumarlas
  del historial igual, es trivial pero no existe todavía como helper).

---

## 2. Qué puede detectar el motor como condición de misión/objetivo

Esto es la base real para diseñar `check(g, snap)` de futuras misiones.
Todo lo marcado "Sí" es leíble hoy sin escribir infraestructura nueva.

| Señal | ¿Se puede detectar? | Dónde vive el dato |
|---|---|---|
| Ganar / perder / empatar un partido | Sí | `matchHistory[i].res` ("V"/"E"/"D") |
| Goles marcados (por partido o carrera) | Sí | `m.myGoals` por partido; `careerGoals(g)` = total de toda la carrera |
| Asistencias | Sí | `m.myAssists` por partido y por temporada; **no existe** un total de carrera ya hecho (fácil de sumar del historial) |
| OVR | Sí | `calcOVR(g.player.stats)` |
| Racha de días (streak) | Sí | `g.player.streak` (se resetea si un día cae en forma "caída") |
| Estadísticas FIS/FUE/RES/NUT/REC/MEN | Sí | `g.player.stats[K]`, con XP en `g.player.xp[K]` |
| Peso | Sí | `g.player.weight0` (inicial) + `g.player.weightLog` (histórico `{d, kg}`) |
| Entrenamientos (gym) | Sí, pero solo flags diarios | `log.gym`, `log.gymProgress`, `log.gymGroups`, `log.gymMin`, `log.gymPR` por día en `g.logs[fecha]`. No hay historial de series/repeticiones/peso por ejercicio |
| Alimentación | Sí | `log.kcal`, `log.prot`, `log.meals` por día; objetivos en `g.player.goals.kcal/protein` |
| Sueño | Sí | `log.sleep` por día; objetivo en `g.player.goals.sleepGoal` |
| Titular / suplente | Sí, solo el último partido | `matchHistory[i].benched`; no hay racha de titularidad ya calculada |
| Hábitos personalizados | Sí | `log.habitsDone` (array de ids) por día |
| Objetos en inventario | Sí | `g.inventory = { itemId: cantidad }` |
| Rendimiento del día (% / forma) | Sí | `dayPct()` → `g.player.form` ("alza"/"buen"/"est"/"caida") |
| Mejor nota de la carrera | Sí | `g.bestRating` |
| Partido de derbi ganado | Sí | `m.derbi && m.res === "V"` en el historial |
| Personajes conocidos / flags de relación | Sí | `g.yunaMet`, `g.metLisa`, `g.metIgor`, `g.metMilly` y sub-flags narrativos puntuales |
| Zonas desbloqueadas | Sí | `g.unlockedZones` (array), `isZoneUnlocked(g, id)` |
| Ascenso de categoría / cambio de club | Sí | `g.tier.id`, comparar con temporadas anteriores vía `careerLog` |
| Lesiones | **No existe** | — |
| Contrato con duración | **No existe** | — |
| Descenso de categoría | **No existe** (el sistema no tiene descenso) | — |
| Rival/club concreto y estable | **No existe** (rivales aleatorios por tier, sin identidad fija) | — |

### Nota práctica para quien diseñe las misiones
El patrón `check(g, snap)` del motor de historias (`checkStories`) siempre
compara el estado actual contra una "foto" (`snap`) tomada al empezar la
etapa — así que cualquier condición de la tabla de arriba es apta para un
objetivo de misión ("desde que empezó esta etapa, ¿ha pasado X?"), salvo las
marcadas como inexistentes, que requerirían añadir el campo antes de poder
usarse como condición.
