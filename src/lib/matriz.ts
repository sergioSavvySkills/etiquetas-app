/**
 * Matriz maestra de etiquetado (Reg. UE 1169/2011).
 *
 * Mapea: tipo de producto (sector) + certificaciones -> normativa aplicable
 * -> menciones obligatorias que debe llevar la ficha/etiqueta.
 *
 * La idea de diseño: el usuario no sabe de normativa. La herramienta clasifica
 * el producto y calcula por él qué menciones son obligatorias; solo le pregunta,
 * en lenguaje sencillo, lo que no puede deducir.
 *
 * Los datos viven en `src/data/matriz.json` (fuente: docs/etiquetado-matriz-maestra.pdf).
 */

import matrizData from "@/data/matriz.json";
import type { FichaTecnica } from "@/lib/ficha";

/** Una mención obligatoria de etiquetado. */
export type Mencion = {
  id: string;
  /** "dato" pide un valor al usuario; "declaracion" es un requisito a confirmar. */
  tipo: "dato" | "declaracion";
  obligatoria: boolean;
  /** Si la IA puede inferirlo de la descripción libre del producto. */
  autodeducible: boolean;
  /** Campo de FichaTecnica que la satisface; si falta, se usa `ficha.extras[id]`. */
  campo?: string;
  etiquetaCorta: string;
  etiquetaLegal: string;
  preguntaUsuario: string;
  explicacion: string;
  baseLegal: string;
};

export type Sector = {
  id: string;
  numero: number;
  nombre: string;
  grupo: string;
  subcategorias: string[];
  normativaBase: string[];
  mencionesExtra: string[];
};

export type Certificacion = {
  id: string;
  nombre: string;
  normativa: string[];
  sello: string;
  mencionesExtra: string[];
};

export type Matriz = {
  mencionesBase: Mencion[];
  mencionesEspeciales: Mencion[];
  sectores: Sector[];
  certificaciones: Certificacion[];
};

export const matriz = matrizData as unknown as Matriz;

export const SECTORES = matriz.sectores;
export const CERTIFICACIONES = matriz.certificaciones;

const POR_ID = new Map<string, Mencion>(
  [...matriz.mencionesBase, ...matriz.mencionesEspeciales].map((m) => [m.id, m]),
);

/** Campos de la ficha que no son simples strings (se completan en su propio paso). */
const CAMPOS_COMPLEJOS = new Set(["ingredientes", "alergenos", "infoNutricional"]);

export function getSector(id: string): Sector | undefined {
  return matriz.sectores.find((s) => s.id === id);
}

export function getCertificacion(id: string): Certificacion | undefined {
  return matriz.certificaciones.find((c) => c.id === id);
}

export function mencionPorId(id: string): Mencion | undefined {
  return POR_ID.get(id);
}

/**
 * Calcula las menciones obligatorias para un producto = menciones base
 * + las propias del sector + las de cada certificación.
 */
export function getRequisitos(sectorId: string, certIds: string[]): Mencion[] {
  const ids = new Set<string>(matriz.mencionesBase.map((m) => m.id));
  getSector(sectorId)?.mencionesExtra.forEach((id) => ids.add(id));
  for (const cid of certIds) {
    getCertificacion(cid)?.mencionesExtra.forEach((id) => ids.add(id));
  }
  return [...ids]
    .map((id) => POR_ID.get(id))
    .filter((m): m is Mencion => Boolean(m));
}

/** Sugerencia simple (cliente) del sector a partir de la descripción libre. */
export function sugerirSector(texto: string): Sector | undefined {
  const t = texto.toLowerCase();
  let mejor: Sector | undefined;
  let mejorPuntos = 0;
  for (const s of matriz.sectores) {
    const tokens = [s.nombre, ...s.subcategorias]
      .join(" ")
      .toLowerCase()
      .split(/[\s,/().·-]+/);
    let puntos = 0;
    for (const w of tokens) {
      if (w.length >= 4 && t.includes(w)) puntos += 1;
    }
    if (puntos > mejorPuntos) {
      mejorPuntos = puntos;
      mejor = s;
    }
  }
  return mejorPuntos > 0 ? mejor : undefined;
}

function leerCampo(ficha: FichaTecnica, campo: string): string {
  return ((ficha as unknown as Record<string, unknown>)[campo] ?? "")
    .toString()
    .trim();
}

/** ¿La ficha ya cubre esta mención? */
export function mencionSatisfecha(m: Mencion, ficha: FichaTecnica): boolean {
  if (!m.campo) return Boolean(ficha.extras[m.id]?.trim());
  switch (m.campo) {
    case "ingredientes":
      return ficha.ingredientes.some((i) => i.nombre.trim());
    case "alergenos":
      // La declaración de alérgenos siempre es válida (vacío = no contiene).
      return true;
    case "infoNutricional":
      return Boolean(ficha.infoNutricional.energiaKcal.trim());
    default:
      return leerCampo(ficha, m.campo) !== "";
  }
}

/** ¿Se edita en su propio paso del wizard (no en línea)? */
export function esCampoComplejo(m: Mencion): boolean {
  return m.campo ? CAMPOS_COMPLEJOS.has(m.campo) : false;
}

/** Devuelve una copia de la ficha con el valor de la mención aplicado. */
export function aplicarValorMencion(
  ficha: FichaTecnica,
  m: Mencion,
  value: string,
): FichaTecnica {
  if (!m.campo) {
    return { ...ficha, extras: { ...ficha.extras, [m.id]: value } };
  }
  if (CAMPOS_COMPLEJOS.has(m.campo)) return ficha;
  return { ...ficha, [m.campo]: value };
}

/** Valor actual de una mención (para precargar inputs en la verificación). */
export function valorMencion(ficha: FichaTecnica, m: Mencion): string {
  if (!m.campo) return ficha.extras[m.id] ?? "";
  if (CAMPOS_COMPLEJOS.has(m.campo)) return "";
  return leerCampo(ficha, m.campo);
}
