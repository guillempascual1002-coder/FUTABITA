// Función serverless (Vercel) que estima kcal y proteína de una comida.
// Esconde tu API key: el navegador nunca la ve.
// Para ACTIVARLA: en Vercel > Settings > Environment Variables, añade ANTHROPIC_API_KEY.
// Si no hay clave configurada, responde 501 y la app cae a entrada manual automáticamente.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method" });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    // Sin clave = IA desactivada. La app lo detecta y ofrece entrada manual.
    return res.status(501).json({ error: "no-key" });
  }

  const { text } = req.body || {};
  if (!text || typeof text !== "string") {
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
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content:
              `Eres un nutricionista. Estima el TOTAL de calorías y proteína de todo lo descrito (si hay varias comidas, súmalas): "${text}". ` +
              `Si la cantidad es ambigua asume una ración normal de adulto. ` +
              `Responde SOLO con JSON válido, sin markdown, sin unidades, sin rangos, sin texto extra. ` +
              `"kcal" y "proteina" deben ser números enteros (ej. 750, no "700-800" ni "aprox 750"). ` +
              `Formato exacto: {"nombre":"nombre corto","kcal":750,"proteina":35}. ` +
              `Si no parece comida responde {"error":true}.`,
          },
        ],
      }),
    });
    const data = await r.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "upstream" });
  }
}
