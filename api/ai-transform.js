// api/ai-transform.js — Proxy seguro para Anthropic API
// La clave ANTHROPIC_API_KEY se configura como variable de entorno en Vercel.
// El browser NUNCA ve la clave ni sufre bloqueo CORS.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'IA no configurada en este servidor' });
  }

  const { garment, measures, method, prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || prompt.length > 2000) {
    return res.status(400).json({ error: 'Prompt inválido' });
  }

  const m = measures || {};
  const userContent =
    'Eres experto en patronaje de ' + (garment || 'prenda') + '. ' +
    'Medidas: Busto ' + (m.bust || 88) + 'cm, Cintura ' + (m.waist || 68) +
    'cm, Cadera ' + (m.hip || 94) + 'cm.' +
    (method ? ' Método: ' + method : '') +
    '. Transformación: "' + prompt +
    '". Responde SOLO con JSON válido: {"descripcion":"...","cambios":["..."]}';

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data?.error?.message || 'Error de IA' });
    }

    const text = (data.content?.[0]?.text || '{}').replace(/```json|```/g, '').trim();
    let parsed;
    try { parsed = JSON.parse(text); } catch (e) { parsed = { descripcion: text, cambios: [] }; }

    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Error al conectar con IA: ' + err.message });
  }
};
