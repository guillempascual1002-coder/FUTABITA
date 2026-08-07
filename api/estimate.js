// Función serverless (Vercel) que estima kcal y proteína de una comida.
// Esconde tu API key: el navegador nunca la ve.
//
// Para ACTIVARLA: en Vercel > Settings > Environment Variables, añade ANTHROPIC_API_KEY.
// Si no hay clave configurada responde 501 y la app cae a entrada manual automáticamente.
//
// Opcional: ALLOWED_ORIGIN (ej. "https://futtabita.vercel.app") para rechazar
// peticiones que no vengan de la propia app.

const MODEL = "claude-sonnet-5";
const MAX_TEXT = 200; // ninguna comida real necesita más, y corta los prompts largos de abuso

/* El API garantiza que la respuesta encaja en este esquema, así que no hacen falta
   instrucciones de "responde solo JSON" ni parseo defensivo de markdown. */
const SCHEMA = {
  type: "object",
  properties: {
    nombre: { type: "string", description: "Nombre corto del plato, máximo 40 caracteres" },
    kcal: { type: "integer", description: "Calorías totales de TODO lo descrito, sumado" },
    proteina: { type: "integer", description: "Proteína total en gramos de TODO lo descrito" },
    es_comida: { type: "boolean", description: "false si el texto no describe comida ni bebida" },
  },
  required: ["nombre", "kcal", "proteina", "es_comida"],
  additionalProperties: false,
};

const PROMPT = (text) =>
  `Eres un nutricionista. Estima el total de calorías y proteína de todo lo descrito, ` +
  `sumando si hay varios alimentos: "${text}". ` +
  `Si la cantidad es ambigua asume una ración normal de adulto. ` +
  `Si el texto no describe comida ni bebida, marca es_comida como false.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    // Sin clave = IA desactivada. La app lo detecta y ofrece entrada manual.
    return res.status(501).json({ error: "no-key" });
  }

  /* Guardia: solo peticiones desde la propia app. No es infalible (la cabecera se
     puede falsificar), pero descarta los escaneos automáticos de endpoints abiertos.
     El tope real de gasto se pone en el panel de Anthropic. */
  const allowed = process.env.ALLOWED_ORIGIN;
  const origin = req.headers.origin || "";
  if (allowed && origin && origin !== allowed) {
    return res.status(403).json({ error: "origin" });
  }

  const { text } = req.body || {};
  if (!text || typeof text !== "string" || text.trim().length === 0 || text.length > MAX_TEXT) {
    return res.status(400).json({ error: "bad-input" });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        /* Sonnet 5 razona por defecto. Para estimar una comida eso solo añade
           tokens de salida (y coste), así que se desactiva explícitamente. */
        thinking: { type: "disabled" },
        output_config: {
          effort: "low",
          format: { type: "json_schema", schema: SCHEMA },
        },
        messages: [{ role: "user", content: PROMPT(text.trim()) }],
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      // Se devuelve el mensaje del API para poder diagnosticar sin abrir los logs
      const detalle = (data && data.error && data.error.message) || "";
      return res.status(502).json({ error: "upstream", detalle: String(detalle).slice(0, 200) });
    }
    if (data.stop_reason === "refusal") return res.status(200).json({ error: "no-food" });

    const bloque = (data.content || []).find((b) => b.type === "text");
    if (!bloque) return res.status(502).json({ error: "empty" });

    const p = JSON.parse(bloque.text);
    if (!p.es_comida) return res.status(200).json({ error: "no-food" });

    return res.status(200).json({
      name: String(p.nombre || "").slice(0, 40),
      kcal: Math.max(0, Math.round(p.kcal)),
      prot: Math.max(0, Math.round(p.proteina)),
    });
  } catch (e) {
    return res.status(500).json({ error: "upstream" });
  }
}
