import Anthropic from "@anthropic-ai/sdk";
import { ALERGENOS_UE } from "@/lib/ficha";
import type { DescribeResult, ImproveResult } from "@/lib/ai";

// El asistente nunca debe cachearse: cada respuesta depende del input.
export const dynamic = "force-dynamic";

const MODEL = "claude-opus-4-8";

const apiKey = process.env.ANTHROPIC_API_KEY;
const client = apiKey ? new Anthropic({ apiKey }) : null;

const SYSTEM_DESCRIBE = `Eres un asistente experto en fichas técnicas de productos alimenticios.
A partir de la descripción libre que escribe el fabricante, extraes la información
estructurada que puedas inferir con confianza. No inventes datos: si algo no se menciona,
deja el campo vacío. Los alérgenos deben ser EXACTAMENTE alguno de esta lista (UE 1169/2011):
${ALERGENOS_UE.join(", ")}.
En "resumen" escribe 1-2 frases, en español, cordiales, indicando qué entendiste y qué
información clave aún falta para completar la ficha técnica.`;

const SYSTEM_IMPROVE = `Eres un asistente experto en fichas técnicas y etiquetado de
alimentos (normativa UE 1169/2011). Recibes el valor que el fabricante escribió para un
campo concreto. Devuelves una versión mejorada (clara, correcta y bien redactada para una
ficha técnica) y un feedback breve en español explicando qué ajustaste o qué conviene
revisar. Si el valor ya está bien, devuélvelo igual y dilo en el feedback.`;

const describeSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    nombreProducto: { type: "string" },
    ingredientes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          nombre: { type: "string" },
          porcentaje: { type: "string" },
          origen: { type: "string" },
        },
        required: ["nombre", "porcentaje", "origen"],
      },
    },
    alergenosContiene: { type: "array", items: { type: "string" } },
    alergenosTrazas: { type: "array", items: { type: "string" } },
    tipoEnvase: { type: "string" },
    condicionesConservacion: { type: "string" },
    modoEmpleo: { type: "string" },
    vidaUtil: { type: "string" },
    resumen: { type: "string" },
  },
  required: ["resumen"],
} as const;

const improveSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    suggestion: { type: "string" },
    feedback: { type: "string" },
  },
  required: ["suggestion", "feedback"],
} as const;

function textFromMessage(content: Anthropic.Messages.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

async function runDescribe(text: string): Promise<DescribeResult> {
  if (!client) return mockDescribe(text);

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    output_config: { effort: "low", format: { type: "json_schema", schema: describeSchema } },
    system: SYSTEM_DESCRIBE,
    messages: [{ role: "user", content: text }],
  });
  return JSON.parse(textFromMessage(res.content)) as DescribeResult;
}

async function runImprove(
  field: string,
  value: string,
  context?: string,
): Promise<ImproveResult> {
  if (!client) return mockImprove(field, value);

  const user = `Campo: ${field}\nProducto: ${context ?? "(sin especificar)"}\nValor actual: ${value}`;
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    output_config: { effort: "low", format: { type: "json_schema", schema: improveSchema } },
    system: SYSTEM_IMPROVE,
    messages: [{ role: "user", content: user }],
  });
  return JSON.parse(textFromMessage(res.content)) as ImproveResult;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { action } = (body ?? {}) as { action?: string };

  try {
    if (action === "describe") {
      const { text } = body as { text?: string };
      if (!text?.trim()) {
        return Response.json({ error: "Falta 'text'" }, { status: 400 });
      }
      return Response.json(await runDescribe(text));
    }

    if (action === "improve") {
      const { field, value, context } = body as {
        field?: string;
        value?: string;
        context?: string;
      };
      if (!field || value === undefined) {
        return Response.json({ error: "Faltan 'field' o 'value'" }, { status: 400 });
      }
      return Response.json(await runImprove(field, value, context));
    }

    return Response.json({ error: "Acción no soportada" }, { status: 400 });
  } catch (err) {
    console.error("Error en /api/ai:", err);
    return Response.json(
      { error: "El asistente no pudo procesar la petición." },
      { status: 502 },
    );
  }
}

// --- Asistente simulado (modo demo sin API key) --------------------------------

function mockDescribe(text: string): DescribeResult {
  const lower = text.toLowerCase();
  const alergenosContiene = ALERGENOS_UE.filter((a) => {
    const clave = a.toLowerCase().split(" ")[0];
    return lower.includes(clave);
  });

  // Toma la primera frase como posible nombre del producto.
  const primeraFrase = text.split(/[.\n]/)[0]?.trim() ?? "";
  const nombreProducto =
    primeraFrase.length > 0 && primeraFrase.length <= 80 ? primeraFrase : "";

  return {
    nombreProducto,
    alergenosContiene,
    resumen:
      "Modo demo (sin clave de IA): hice una lectura básica de tu descripción y precargué lo que pude detectar. Configura ANTHROPIC_API_KEY para un análisis completo. Revisa y completa los siguientes pasos.",
    simulado: true,
  };
}

function mockImprove(field: string, value: string): ImproveResult {
  const limpio = value.trim().replace(/\s+/g, " ");
  const suggestion = limpio
    ? limpio.charAt(0).toUpperCase() + limpio.slice(1)
    : value;
  return {
    suggestion,
    feedback: `Modo demo (sin clave de IA): normalicé el formato de "${field}". Configura ANTHROPIC_API_KEY para validación y mejoras reales.`,
    simulado: true,
  };
}
