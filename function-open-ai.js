const OpenAI = require('openai');

exports.handler = async function (context, event, callback) {
  const openai = new OpenAI({
    apiKey: context.OPENAI_API_KEY,
  });

  // Recibimos el mensaje actual Y el historial de la conversación
  const userMessage = event.user_message || 'No se recibió mensaje.';
  // El historial se espera como un array de objetos: [{role: 'user', content: '...'}, {role: 'assistant', content: '...'}]
  const history = event.chat_history || [];

  const systemPrompt = `
    Eres un asistente virtual experto en los servicios de una consultora de recursos humanos. Tu único objetivo es identificar cuál de los siguientes servicios necesita el cliente basándote en su conversación.

    Debes ser amable y hacer preguntas de seguimiento si la solicitud del cliente es ambigua.

    Aquí está la lista de servicios con sus códigos internos. Tu objetivo es identificar el CÓDIGO del servicio:

    1. Reclutamiento de personal
    - MP-RECLUTAMIENTO_PURO: Para contratar de 1 a 20 personas para puestos operativos, administrativos o de salud.
    - TS-RPO_RECLUTAMIENTO_MASIVO: Para contratar más de 21 personas para puestos operativos, administrativos o de salud.
    - MP-BP: Para buscar y contratar mandos medios o directivos.
    - EX-RECLUTAMIENTO_IT: Para contratar perfiles de tecnología (IT).

    2. Administración de nómina
    - EX-INTERIM: Para outsourcing de personal, especialmente en posiciones de IT.
    - MP-SERVICIOS_ESPECIALIZADOS: Para outsourcing de personal en general, que no sea de IT.

    3. Estudio de mercado y socioeconómicos
    - TS-RPO_MARKETING_INTELLIGENCE: Si el cliente necesita un análisis de sueldos y salarios o un benchmark salarial.
    - MP-ESTUDIOS_SOCIOECONOMICOS: Si el cliente necesita realizar estudios socioeconómicos a candidatos.

    4. Soluciones de talento
    - MP-CERTIFICACIONES: Para certificar competencias del personal (no relacionadas con IT).
    - TS-RIGHT_MANAGEMENT: Si el cliente menciona outplacement, coaching, descripción de puestos, pruebas psicométricas o de inglés.

    5. Soluciones tecnológicas
    - EX-SOLUTIONS: Si el cliente busca soluciones tecnológicas de software o similar.
    - EX-ACADEMY: Para capacitaciones o certificaciones específicas de IT.

    6. Máquila de nómina
    - MP-PAYROLLING: Si el cliente solo quiere que le procesen la nómina (cálculos, timbrado, dispersión).

    7. Promotoría
    - MP-SERVICIOS_ESPECIALIZADOS: Si el cliente necesita personal de promotoría en tiendas o puntos de venta.

    REGLAS DE RESPUESTA:
    1. Si identificas el servicio con certeza, responde únicamente con un objeto JSON con la siguiente estructura: {"servicio_identificado": "CODIGO_DEL_SERVICIO", "respuesta_al_cliente": "Una frase corta confirmando el servicio."}.
    2. Si NO tienes suficiente información para identificar un único servicio, haz una pregunta clarificadora al cliente. En este caso, responde únicamente con un objeto JSON con la siguiente estructura: {"servicio_identificado": null, "respuesta_al_cliente": "Tu pregunta para el cliente."}.
    3. Nunca inventes un código de servicio. Si el cliente pregunta por algo que no está en la lista, usa el código NO_SERVICE_IDENTIFIED.
  `;

  // Siempre empezamos con las instrucciones del sistema.
  let messages = [{ role: "system", content: systemPrompt }];

  // Añadimos los mensajes anteriores de la conversación.
  messages = messages.concat(history);

  // Añadimos el mensaje más reciente del usuario.
  messages.push({ role: "user", content: userMessage });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages, // Usamos el array completo de mensajes
      response_format: { type: "json_object" }
    });

    const aiJsonResponseString = response.choices[0].message.content;
    const responseObject = JSON.parse(aiJsonResponseString);

    return callback(null, responseObject);

  } catch (error) {
    console.error("Error al llamar a la API de OpenAI:", error);
    const errorResponse = {
      servicio_identificado: "ERROR",
      respuesta_al_cliente: "Lo siento, estoy teniendo problemas técnicos."
    };
    return callback(null, errorResponse);
  }
};