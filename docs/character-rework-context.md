# FUTABITA — Contexto para diseño/rework de personajes

Este documento es para pasárselo a otra IA que va a **diseñar o mejorar el contenido de un personaje** (diálogos, moods, misión, variantes). Explica cómo está montado el juego y el motor de diálogo, y al final incluye el **perfil completo actual de Yuna** como caso de estudio, más una plantilla de qué debe devolver el rework.

---

## 1. Qué es FUTABITA

Simulador de carrera de futbolista en modo texto/chat, con estética de app de móvil. El jugador entrena, come, duerme y juega partidos; varios personajes recurrentes le escriben mensajes tipo WhatsApp/redes cada día, con su propio retrato, personalidad y arco narrativo. Tono: cercano, con humor, nada acartonado — cada personaje tiene una voz muy marcada y consistente.

Todo el contenido está en español (España), coloquial.

---

## 2. El motor de diálogo — formatos de entrada

Cada personaje tiene un **pool** (array) de posibles mensajes. Cada día, el juego elige personajes al azar (ver §7) y de su pool elige una entrada que cumpla sus condiciones. Una entrada puede tener estas formas:

### a) Línea suelta (una sola burbuja)
```js
{ t: "Texto del mensaje." }
```

### b) Escena de 2 (o más) burbujas seguidas, con cambio de pose
```js
{ beats: [
  { m: "idle", t: "Primera frase, con la pose neutra." },
  { m: "angry", t: "Segunda frase, cambia de pose a medio camino de la idea." }] }
```
Esto es el recurso favorito para el "giro" de una idea: arranca en un tono y remata en otro (ej. Yuna empieza seria/neutra y remata sonrojada). El mood (`m`) se puede especificar por burbuja.

### c) Pregunta con respuestas del jugador (rama corta)
```js
{ t: "Pregunta que hace el personaje.", replies: [
  { t: "Opción A que puede elegir el jugador", r: ["Reacción posible 1", "Reacción posible 2"] },
  { t: "Opción B", r: ["Reacción única"] }] }
```
`r` es una lista de variantes de la MISMA reacción (se elige una al azar cada vez) — no es una secuencia, es "una de estas frases, la que sea, dice lo mismo con matices distintos". Sirve para que no se sienta repetitivo si el jugador ve esa rama varias veces.

Las opciones de respuesta pueden llevar también:
- `m: "mood"` — qué pose usa la reacción del personaje a esa respuesta.
- `setFlag: "nombreFlag"` — marca un flag persistente en la partida (para poder referenciarlo luego, ver `w:` abajo).
- `giveItem: "id_objeto"` — el jugador recibe un objeto del inventario al elegir esa opción.

### d) Condición de aparición (`w:`)
Cualquier entrada (de los 3 tipos de arriba) puede llevar `w: "nombreCondicion"`, que la limita a aparecer solo si esa condición se cumple ese día. Condiciones ya definidas:

| Condición | Se cumple cuando... |
|---|---|
| `win` / `loss` | El último partido jugado se ganó / perdió |
| `benched` | Fuiste suplente en el último partido |
| `hot` | Racha ≥ 6 días seguidos cumpliendo objetivos |
| `good` | Racha ≥ 3 días, o la forma física está "en alza" |
| `bad` | Forma "en caída", o llevas ≥1 día flojo |
| `scorer` | ≥3 goles en la temporada actual |
| `hasGoals` | ≥1 gol en la temporada actual |
| `kgUp` | Has ganado ≥1 kg desde que empezaste |
| `derbiSoon` | El derbi es el próximo partido |
| `seasonStart` / `seasonEnd` | Primera jornada / últimas 2 jornadas de la temporada |
| `metLisa` / `metMilly` / `metYuna` / `metIgor` | Ya conoces a ese personaje (para que se mencionen entre ellos) |
| Flags custom (`lisaTilin`, `millySecret`...) | Flags que un personaje marca con `setFlag` en una de sus propias ramas, para poder tener "callbacks" más adelante a una decisión pasada |

Se pueden inventar condiciones/flags nuevos si hacen falta para el arco de un personaje — solo hay que definir de dónde salen (con `setFlag` en una respuesta, o una condición nueva basada en datos de partida).

### e) Variables de plantilla
Dentro del texto se pueden usar variables que el juego rellena solas: `{club}`, `{player}` (nombre del jugador), `{position}`, `{league}`, `{season}`, `{ovr}` (media general), `{goals}`, `{assists}`, `{streak}`, `{kg}` (kg ganados desde el inicio), `{derbiRival}`.

---

## 3. Sistema de moods / poses

Cada personaje tiene un objeto `arts` con sus poses disponibles (rutas de imagen) y un mood por defecto (`def`, casi siempre `"idle"`). Ejemplo real:

```js
yuna: { name: "Yuna", color: "#D4537E", icon: "/images/yuna_icon.webp",
  arts: { idle: "...", happy: "...", angry: "...", preocupada: "...", barcelona: "..." }, def: "idle" }
```

Reglas importantes:
- **No todos los personajes tienen los mismos moods.** Cada uno tiene los que le hacen falta para su personalidad — algunos no tienen `angry` porque no pega con ellos (Milly, Igor), y varios tienen moods **únicos e inventados para su propio arco**, no genéricos:
  - En Yuna, `angry` en realidad es su cara de **sonrojo de tsundere pillada en falta** (nunca enfado real).
  - `preocupada` en Yuna es su preocupación genuina, antes de taparla con el sonrojo — se usa como primera burbuja de una escena de 2, justo antes del `angry`.
  - `barcelona` en Yuna es su lado fan sin disimulo (cuando habla del Barça en sí, no de ti) — vestida de corto con la camiseta.
  - En Karla, `angry` es en realidad **ego/chulería**, nunca enfado.
  - En Milly, `periodico` es la pose sujetando el periódico, reservada para el instante exacto de la entrega (no un mood genérico de "seria").
- Cuando se pide un personaje nuevo o un rework, **lo normal es proponer 1-2 moods nuevos que sean específicos de su personalidad**, no simplemente "triste" o "sorprendida" genéricos — algo que cuente algo de quién es.
- Las cartas de personaje (galería en la pestaña "Yo") muestran todas sus poses en un carrusel; las que el jugador aún no ha visto en una conversación real aparecen como silueta negra hasta que las desbloquea viéndolas en un diálogo real.

---

## 4. Variantes "fuera de servicio" (mismo personaje, otra zona)

Casi todos los personajes tienen, además de su identidad principal, una o varias **variantes de zona**: el mismo personaje pero en otro sitio de la ciudad, con un pool de diálogo propio y (a veces) una pose nueva, aunque muchas veces reutiliza el arte que ya tiene. Ejemplos reales de Yuna:
- `Yuna` (principal) → aparece en El Barrio.
- `Yuna Tienda` → aparece en la Tienda Oficial, comprando merchandising.
- `Yuna Estadio` → aparece en el Gran Estadio (zona de cierre de partida, tono más emotivo).

Cada variante es una entidad de diálogo aparte (con su propio pool corto, 5-6 entradas normalmente) pero **es el mismo personaje** — incluso puede reutilizar exactamente los mismos retratos que ya tiene, si no hay arte nuevo para esa variante.

Cuando dos variantes del MISMO personaje podrían coincidir en el mismo día de forma rara (p.ej. Elisa "casual" en el parque Y Elisa "de gala" en el casino el mismo día), el sistema fuerza que solo pueda estar en un sitio a la vez. Esto no aplica entre personajes DISTINTOS: sí pueden coincidir varios personajes distintos en la misma zona el mismo día (p.ej. la Playa la comparten Elisa, Milly, López y Karla).

---

## 5. Sistema de misiones

Cada personaje principal tiene (opcionalmente) una misión de **4 etapas**, con esta forma:

```js
nombre: {
  label: "Título de la misión",
  npc: "clave_del_personaje",
  trigger: (g) => /* condición para que arranque, ej. días desde el fichaje, o conocerle antes */,
  stages: [
    { title: "...", objective: "Texto del objetivo para el jugador",
      intro: [ /* 2 beats de diálogo al arrancar la etapa */ ],
      snap: (g) => ({ /* estado de referencia al empezar la etapa, para medir progreso */ }),
      check: (g, snap) => /* true cuando se cumple el objetivo */ },
    // ... 2 etapas intermedias más ...
    { title: "...", final: true,
      intro: [ /* diálogo de éxito */ ],
      introFail: [ /* diálogo alternativo si no se llegó a tiempo (deadlineDays) */ ],
      reward: (g) => /* sube 1 punto una stat concreta, a veces + un objeto */ },
  ],
}
```

Las 3 primeras etapas suelen ser objetivos de progresión (racha, victorias, subir de categoría, un gol...) crecientes en dificultad; la última etapa es el cierre emocional del arco y da la recompensa (normalmente +1 a una stat relacionada con la personalidad del personaje).

---

## 6. Objetos (inventario)

Registro simple `ITEMS`, cada uno con `name`, `icon` (ahora mismo emoji, pronto imagen), `kind` ("consumable" da XP a una stat al usarlo y se gasta; "gift" se regala a un personaje concreto y dispara su reacción, sin dar XP) y `desc`. Un personaje puede:
- Regalarte un objeto directamente en una rama de diálogo (`giveItem` en una respuesta).
- Ser el destinatario de un objeto tipo "gift" que otro personaje menciona.
- Dar un objeto como recompensa final de su misión.

---

## 7. Cómo se decide quién aparece cada día

(Contexto de fondo, no hace falta tocarlo al diseñar un personaje, pero ayuda a entender el ritmo.) Cada día se eligen 3-4 personajes al azar de entre los que ya conoces, con el mismo peso cada uno (no importa cuántas variantes de zona tenga). Para cada uno elegido, se sortea después CUÁL de sus variantes/zonas le toca hoy. Las apariciones no llegan todas de golpe: se reparten con horas aleatorias a lo largo del día, así que cada vez que se abre la app hay opción de que aparezca alguien nuevo.

---

## 8. El reparto actual (personalidades, en una frase)

- **Elisa** — mánager y entrenadora. Dura en el despacho, blanda cuando cree que nadie mira. `angry` = decepción contenida, nunca grito.
- **López** — capitán del vestuario. Animado, gracioso, anécdotas constantes. Nunca tiene `angry`, no pega con su rol.
- **Yuna** — superfan tsundere del Barça (ver perfil completo abajo).
- **Karla** — futbolista profesional que gestiona tus patrocinios. Engreída, ego, mide todo en términos de estatus. `angry` = chulería, nunca enfado real.
- **Milly** — dueña del Kiosco, te trae el periódico en persona cada día; también hace de periodista/entrevistadora en la Sala de Prensa. Cotilla, dramática, alegre.
- **Igor** — chef del Restaurante (mapa Metrópolis). Trata la nutrición como táctica de fútbol, dato curioso siempre a mano.

---

## 9. CASO DE ESTUDIO: perfil completo actual de Yuna

### Identidad
- Nombre mostrado: **Yuna**. Color de acento: `#D4537E`.
- Icono y arte: idle / happy / angry / preocupada / barcelona (ver §3 para qué representa cada uno).
- Trigger de aparición: se presenta la primera vez que **marcas tu primer gol de la carrera** (no por ganar un partido — cambiado recientemente a propósito).

### Personalidad
Tsundere clásica, fan declarada del FC Barcelona. Sigue de cerca al jugador "por motivos puramente periodísticos/estadísticos" (excusa que se repite y se cae sola constantemente) y se avergüenza en cuanto se le nota que le importa de verdad. Nunca admite directamente que le gusta el club/jugador — siempre hay una capa de excusa encima.

### Escena de presentación (2 beats)
1. *(idle)* "¿Tú eres el nuevo del {club}, no? ...Yo pasaba por aquí. Soy Yuna. Fan del Barça, para que lo sepas: MI equipo juega en el Camp Nou. El tuyo es... aceptable."
2. *(angry)* "P-pero has marcado, así que... bien. Supongo. ¡No pienses que he venido a verte a TI! Solo pasaba. Por aquí. Casualmente."

### Estructura típica de sus líneas
Casi todas sus entradas de 2 beats siguen el mismo patrón: arranca en `idle` con una observación "objetiva/periodística", y remata en `angry` (sonrojo) delatándose. Cuando el tema es genuinamente triste (banquillo, derrota), arranca en `preocupada` en vez de `idle` — se le cae la máscara del tsundere un segundo antes de taparlo con el enfado/sonrojo. Cuando habla puramente del Barça (no de ti), usa `barcelona`.

Pool actual completo (21 entradas + 2 de intro), por bloques:
- **Sonrojada por logros del jugador**: reacciona (con excusa) a victorias, banquillo, goles marcados, mejora física, rachas.
- **Regalos**: le regala una bufanda del Barça "porque sobraba lana", dos veces en el pool (con distinto contexto), niega tajantemente que la hiciera pensando en él.
- **Feliz/fan pura (`barcelona`)**: habla de fichajes del Barça, pide entrada de favor para el Camp Nou, se explaya sobre El Clásico en clase.
- **Ramas con respuesta**: pregunta táctica (casa/fuera), la acusan de "algo" con el jugador y pide opinión, pregunta hipotética de si se acordará de ella cuando triunfe.
- **Derrota (`preocupada`→sonrojo/enfado)**: dos variantes — una consolando, otra defendiéndole ante gente que habló mal de él en el bus.

### Misión: "La bufanda equivocada" (trigger: ya conocida + ≥10 días desde el fichaje)
1. **Confesión a medias** — objetivo: marca un gol. Pide "material para su archivo", tapa el interés real con la excusa periodística.
2. **El offside emocional** — objetivo: gana el derbi. Se nota muy nerviosa por el Barça, "no por otra cosa".
3. **La palabra prohibida** — objetivo: racha de 6 días. Promete decir algo importante si lo consigues, sin especificar qué.
4. **Sin rodeos** (final) — si se cumplió: se confiesa sin tapujos, una sola vez, "no lo voy a repetir". Si no: guarda el discurso para otra vez, con un último rastro de sonrojo negándolo.
   - Recompensa: +1 MEN.

### Variantes de zona actuales
- **Yuna Tienda** (Tienda Oficial) — de compras, mirando la camiseta del rival "por comparar la tela", se le escapa que también miró la del jugador.
- **Yuna Estadio** (Gran Estadio, zona de cierre de partida) — tono más emotivo que el resto de su repertorio: reconoce que nunca pensó llegar a animar en un estadio de Primera "por ti, que conste".

---

## 10. Qué debería traer el documento de rework

Para que pueda implementarlo directamente sin tener que rediseñar la estructura, el documento de vuelta debería incluir, para el personaje en cuestión:

1. **Personalidad** (si cambia algo respecto a la actual) y qué "excusa"/mecánica de voz la sostiene (como el tsundere de Yuna).
2. **Lista de moods**, cuáles son nuevos y qué representa cada uno (aunque no haya imagen todavía, describir la pose para poder encargarla después).
3. **Diálogos nuevos/reescritos**, ya en el formato de arriba (línea suelta / beats / replies), indicando qué `w:` (condición) le corresponde a cada uno si aplica.
4. **Variantes de zona** que debería tener (cuáles ya existen en el juego — ver §4 y la lista de zonas si hace falta pedirla — y qué tono/contenido tendría en cada una).
5. **Misión** (si se reescribe): las 4 etapas con objetivo, intro de 2 beats por etapa, y qué stat sube al final.
6. Cualquier **flag/condición nueva** que necesite (con una frase de cuándo se marca y cuándo se consulta).

No hace falta que la otra IA toque código ni sepa nombres de variables internas — con el formato de arriba y las descripciones basta para que yo lo implemente.
