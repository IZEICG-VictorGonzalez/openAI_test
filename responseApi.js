import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // define la API Key en tu entorno
});

const servicios = `
1. Reclutamiento de personal
- MP-RECLUTAMIENTO_PURO: Operativos, administrativos, áreas de salud de 1 a 20 personas. (Reclutamiento)
- TS-RPO_RECLUTAMIENTO_MASIVO: Operativos, administrativos, áreas de salud de 21 personas en adelante. (Reclutamiento Masivo)
- MP-BP: Mandos medios/directivos. (Reclutamiento)
- EX-RECLUTAMIENTO_IT: Posiciones de IT. (Reclutamiento)

2. Administración de nómina
- EX-INTERIM: Posiciones y outsourcing con IT. (Servicios Especializados)
- MP-SERVICIOS_ESPECIALIZADOS: Posiciones y outsourcing sin IT, promotoría. (Servicios Especializados)

3. Estudio de mercado y socioeconómicos
- TS-RPO_MARKETING_INTELLIGENCE: Análisis de sueldos y salarios, benchmark salarial. (Estudios de Sueldos y Salarios)
- MP-ESTUDIOS_SOCIOECONOMICOS. (Estudios Socioeconómicos)

4. Soluciones de talento
- MP-CERTIFICACIONES: Certificaciones sin IT. (Certificación de Competencias)
- TS-RIGHT_MANAGEMENT: Outplacement, coaching, perfil de puestos, competencias, psicométricas, pruebas de inglés, transición.

5. Soluciones tecnológicas
- EX-SOLUTIONS. (Soluciones Tecnológicas)
- EX-ACADEMY: Certificaciones/Capacitaciones con IT. (Programas de Capacitación IT)

6. Máquila de nómina
- MP-PAYROLLING: Máquila de nómina, timbrado CFDI, cálculos, dispersión. (Maquila de Nómina)

7. Promotoría
- MP-SERVICIOS_ESPECIALIZADOS: Promotoría. (Servicios Especializados)

8. Ventas Flex
- NO_SERVICE_IDENTIFIED
`.trim();

// Herramienta que el modelo debe llamar
const tools = [
  {
    type: "function",
    function: {
      name: "select_service",
      description:
        "Devuelve la clasificación final con la clave del servicio y el nombre amigable (entre paréntesis en la lista).",
      parameters: {
        type: "object",
        properties: {
          clave: { type: "string" },
          nombre_usuario: { type: "string" }
        },
        required: ["clave", "nombre_usuario"],
        additionalProperties: false
      }
    }
  }
];

const instructions = `
Eres un asistente que identifica la categoría correcta de servicio.
Debes devolver el resultado mediante UNA llamada a la función "select_service" con { "clave", "nombre_usuario" }.

Reglas:
- Usa SOLO las claves contenidas exactamente en la lista de servicios provista.
- "nombre_usuario" debe ser el texto dentro de los paréntesis de esa misma línea.
- Si no encuentras coincidencia clara, usa {"clave":"NO_SERVICE_IDENTIFIED","nombre_usuario":"No identificado"}.
Lista de servicios:
${servicios}
`.trim();

export async function identificarServicio(userMessage) {
  const run = await client.responses.create({
    model: "gpt-4o-mini",
    instructions,
    input: [
      {
        role: "user",
        content: [{ type: "text", text: userMessage }]
      }
    ],
    tools,
    tool_choice: "auto"
  });

  // Extraemos la llamada a la herramienta
  let clave = "NO_SERVICE_IDENTIFIED";
  let nombre_usuario = "No identificado";

  const outputs = run.output || [];
  for (const item of outputs) {
    if (item.type === "tool_call" && item.tool_name === "select_service") {
      const args = item.arguments || {};
      if (typeof args.clave === "string") clave = args.clave;
      if (typeof args.nombre_usuario === "string") nombre_usuario = args.nombre_usuario;
      break;
    }
  }

  return { clave, nombre_usuario };
}

// Ejemplo de uso
(async () => {
  const mensaje = "Necesito capacitar a mi equipo de IT en nuevas tecnologías";
  const resultado = await identificarServicio(mensaje);
  console.log(resultado);
})();