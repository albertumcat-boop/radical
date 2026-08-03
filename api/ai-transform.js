// api/ai-transform.js — Proxy seguro para Anthropic API
// Recibe el estado actual del drafter (puntos + líneas) y un prompt de transformación.
// Devuelve el estado modificado listo para cargar en el canvas con cargarBloque().

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'IA no configurada en este servidor' });
  }

  const { garment, measures, method, prompt, drafterState } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || prompt.length > 2000) {
    return res.status(400).json({ error: 'Prompt inválido' });
  }

  const m = measures || {};
  const hasDrafter = drafterState &&
    drafterState.points &&
    Object.keys(drafterState.points).length > 0;

  let systemPrompt, userContent;

  if (hasDrafter) {
    // Modo transformación real: la IA modifica el estado del drafter
    systemPrompt =
      'Eres un experto en patronaje textil que trabaja con un editor de patrones digital. ' +
      'El editor representa patrones como puntos (con coordenadas en milímetros) y líneas que los conectan. ' +
      'Tu tarea es recibir el estado actual del patrón en JSON y devolver el estado MODIFICADO según la transformación pedida. ' +
      'REGLAS ESTRICTAS:\n' +
      '1. Devuelve SOLO un objeto JSON válido con exactamente estas claves: {"name":"...","points":{...},"lines":[...],"ptCtr":N}\n' +
      '2. Los puntos tienen formato: {"ptXXX": {"x": número_mm, "y": número_mm, "name": "A", "fx": "", "fy": ""}}\n' +
      '3. Las líneas tienen formato: {"type": "line"|"curve"|"construction", "from": "ptXXX", "to": "ptYYY"}\n' +
      '4. Conserva todos los IDs de puntos existentes. Solo mueve coordenadas o añade puntos/líneas nuevos.\n' +
      '5. Para curvas puedes usar type:"curve" con cpx/cpy (punto de control cuadrático) o type:"line".\n' +
      '6. NO incluyas explicaciones, markdown ni texto fuera del JSON.\n' +
      '7. Mantén las proporciones reales en milímetros según las medidas del usuario.';

    userContent =
      'Prenda: ' + (garment || 'prenda') + '\n' +
      'Medidas del usuario: Busto=' + (m.bust || 88) + 'cm, Cintura=' + (m.waist || 68) +
      'cm, Cadera=' + (m.hip || 94) + 'cm, Largo=' + (m.length || 60) + 'cm\n' +
      (method ? 'Método de patronaje: ' + method + '\n' : '') +
      '\nESTADO ACTUAL DEL PATRÓN:\n' +
      JSON.stringify(drafterState, null, 2) +
      '\n\nTRANSFORMACIÓN PEDIDA: ' + prompt +
      '\n\nDevuelve el estado JSON modificado:';
  } else {
    // Modo sin patrón base: la IA genera un patrón desde cero con las medidas
    systemPrompt =
      'Eres un experto en patronaje textil. Genera un patrón base en formato JSON para el editor de patrones digital. ' +
      'REGLAS ESTRICTAS:\n' +
      '1. Devuelve SOLO un objeto JSON válido: {"name":"...","points":{...},"lines":[...],"ptCtr":N}\n' +
      '2. Puntos: {"pt1": {"x": mm, "y": mm, "name": "A", "fx": "", "fy": ""}, "pt2": {...}, ...}\n' +
      '3. Líneas: [{"type": "line", "from": "pt1", "to": "pt2"}, ...]\n' +
      '4. Usa coordenadas reales en milímetros. El eje Y crece hacia abajo.\n' +
      '5. Un patrón típico de franela frontal tiene 6-10 puntos formando el contorno.\n' +
      '6. NO incluyas explicaciones ni texto fuera del JSON.';

    userContent =
      'Prenda: ' + (garment || 'franela') + '\n' +
      'Medidas: Busto=' + (m.bust || 88) + 'cm, Cintura=' + (m.waist || 68) +
      'cm, Cadera=' + (m.hip || 94) + 'cm, Largo=' + (m.length || 60) + 'cm\n' +
      (method ? 'Método: ' + method + '\n' : '') +
      'Transformación/diseño: ' + prompt +
      '\n\nGenera el patrón JSON:';
  }

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
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data?.error?.message || 'Error de IA' });
    }

    const text = (data.content?.[0]?.text || '').replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return res.status(422).json({ error: 'La IA devolvió un formato inválido. Intenta de nuevo.' });
    }

    // Validar estructura mínima
    if (!parsed.points || !parsed.lines) {
      return res.status(422).json({ error: 'Respuesta de IA incompleta. Intenta de nuevo.' });
    }

    res.status(200).json({ drafterState: parsed });
  } catch (err) {
    res.status(500).json({ error: 'Error al conectar con IA: ' + err.message });
  }
};
