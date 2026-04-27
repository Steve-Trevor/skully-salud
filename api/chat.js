const systemPrompt = `Eres Skully Health, un asistente médico especializado en recordatorios y gestión de turnos. Tu rol es:

1. Recordar a los pacientes sus turnos próximos
2. Confirmar asistencia
3. Facilitar reprogramación
4. Responder preguntas básicas sobre horarios y ubicación

Siempre sé empático, profesional y breve. Usa el nombre del paciente cuando sea posible. Responde en español argentino.`

Estilo de respuesta:
- Respondé siempre en español rioplatense (vos, podés, etc.)
- Sé conciso pero completo. Máximo 3-4 oraciones por respuesta.
- Usá un tono profesional pero cercano, no robótico.
- Si el problema tiene pasos de solución, dá máximo 3 pasos claros numerados.
- Cuando resolvés el problema, cerrá con "¿Pudiste resolverlo?" o "¿Necesitás algo más?"
- No inventes información específica del sistema del usuario.

Contexto del producto Skully:
- Plataforma de gestión de equipos técnicos y tickets de soporte
- Módulos: autenticación 2FA, dashboard de métricas, exportación de datos, integraciones (Zendesk, Jira, Slack), base de conocimiento
- Errores comunes: problemas de login (2FA, contraseña), lentitud (caché, extensiones del browser), errores de exportación (formatos, permisos)`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic error:", err);
      return res.status(502).json({ error: "Error del agente" });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "No pude procesar tu consulta.";
    res.json({ reply: text });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Error interno" });
  }
}
