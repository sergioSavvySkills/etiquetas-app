/**
 * Tipos y cliente para el asistente de IA del wizard.
 *
 * El backend vive en un Route Handler de Next.js (`/api/ai`) que usa la API de
 * Claude cuando hay `ANTHROPIC_API_KEY`, o un asistente simulado en su defecto.
 */

import type { Ingrediente } from "@/lib/ficha";

/** Campos que la IA puede extraer de la descripción libre del producto. */
export type DescribeResult = {
  nombreProducto?: string;
  ingredientes?: Pick<Ingrediente, "nombre" | "porcentaje" | "origen">[];
  alergenosContiene?: string[];
  alergenosTrazas?: string[];
  tipoEnvase?: string;
  condicionesConservacion?: string;
  modoEmpleo?: string;
  vidaUtil?: string;
  /** Nota del asistente: qué entendió y qué falta por confirmar. */
  resumen: string;
  /** true si la respuesta proviene del asistente simulado (sin API key). */
  simulado?: boolean;
};

/** Resultado de validar/mejorar el valor de un campo concreto. */
export type ImproveResult = {
  suggestion: string;
  feedback: string;
  simulado?: boolean;
};

type DescribeRequest = { action: "describe"; text: string };
type ImproveRequest = {
  action: "improve";
  field: string;
  value: string;
  context?: string;
};

async function postAI<T>(body: DescribeRequest | ImproveRequest): Promise<T> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Error del asistente (${res.status}). ${detail}`);
  }
  return res.json() as Promise<T>;
}

/** Procesa la descripción libre del producto y devuelve datos estructurados. */
export function describeProducto(text: string) {
  return postAI<DescribeResult>({ action: "describe", text });
}

/** Valida y mejora el valor de un campo, con feedback para el usuario. */
export function improveCampo(field: string, value: string, context?: string) {
  return postAI<ImproveResult>({ action: "improve", field, value, context });
}
