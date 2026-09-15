/**
 * Modelo del espacio de trabajo de etiquetado.
 *
 * Tres ideas:
 *  - Requisito: cada cosa que hace falta para redactar la etiqueta. Se calcula
 *    dinámicamente a partir del sector y las certificaciones (matriz maestra).
 *  - Documento: fichero que el usuario adjunta en el chat (analíticas, FT del
 *    proveedor, fotos…). Un documento puede cubrir varios requisitos.
 *  - Mensaje: el hilo del chat central.
 *
 * Esta fase es solo UI/UX: los datos son de demostración y el "análisis" está
 * simulado en el cliente.
 */

import {
  getCertificacion,
  getSector,
  mencionPorId,
  type Mencion,
} from "@/lib/matriz";
import { evaluarAnalisis, type Atributos } from "@/lib/laboratorio";

export type { Atributos } from "@/lib/laboratorio";
export { ATRIBUTOS_POR_DEFECTO } from "@/lib/laboratorio";

/* ------------------------------------------------------------------ */
/* Tipos                                                                */
/* ------------------------------------------------------------------ */

export type EstadoRequisito =
  | "pendiente"
  | "recibido"
  | "analizando"
  | "verificado"
  | "incidencia"
  | "no_aplica";

export type FaseId =
  | "producto"
  | "laboratorio"
  | "declaraciones"
  | "envase"
  | "legal"
  | "sector";

export type Origen = "documento" | "dato" | "declaracion";

export type Requisito = {
  id: string;
  fase: FaseId;
  titulo: string;
  /** Qué es y por qué se pide. */
  descripcion: string;
  /** Guía: con qué documento o dato se cubre. */
  comoSeCubre: string;
  baseLegal?: string;
  obligatoria: boolean;
  origen: Origen;
  /** De dónde sale el requisito (sector, certificación, criterio del cliente…). */
  motivo: string;
  /** Qué debe incluir el informe o el dato (checklist para el usuario). */
  parametros?: string[];
  /** Matiz adicional (p. ej. «puede calcularse»). */
  nota?: string;
};

/** Requisito que no aplica a este producto, con el motivo. */
export type Excluido = { id: string; titulo: string; fase: FaseId; motivo: string };

export type Dato = { etiqueta: string; valor: string };

export type Documento = {
  id: string;
  nombre: string;
  tipo: "pdf" | "imagen" | "hoja" | "otro";
  /** Bytes. */
  tamano: number;
  subidoEn: string;
  paginas?: number;
  /** Resumen de lo que el asistente ha entendido del documento. */
  resumen?: string;
  /** Datos extraídos del documento. */
  extractos: Dato[];
  /** Si no se pudo leer. */
  legible: boolean;
};

export type EstadoItem = {
  estado: EstadoRequisito;
  documentoIds: string[];
  datos: Dato[];
  nota?: string;
};

export type AccionMensaje = {
  etiqueta: string;
  documentoId: string;
  requisitoId: string;
};

export type Mensaje = {
  id: string;
  autor: "usuario" | "asistente";
  texto: string;
  hora: string;
  adjuntos?: string[];
  /** Requisitos que este mensaje ha afectado (se muestran como chips). */
  requisitosRef?: string[];
  /** Botones de acción rápida (vincular un documento a un requisito). */
  acciones?: AccionMensaje[];
  escribiendo?: boolean;
};

/* ------------------------------------------------------------------ */
/* Catálogos                                                            */
/* ------------------------------------------------------------------ */

export const FASES: { id: FaseId; nombre: string; descripcion: string }[] = [
  {
    id: "producto",
    nombre: "Información del producto",
    descripcion: "Lo que nos cuenta el cliente o su proveedor.",
  },
  {
    id: "laboratorio",
    nombre: "Análisis de laboratorio",
    descripcion: "Informes de laboratorio externo. Leemos el PDF y comprobamos valores.",
  },
  {
    id: "declaraciones",
    nombre: "Alérgenos y declaraciones",
    descripcion: "Menciones que exigen comprobación legal.",
  },
  {
    id: "envase",
    nombre: "Envase, conservación y uso",
    descripcion: "Criterio del cliente y menciones de uso.",
  },
  {
    id: "legal",
    nombre: "Responsable y registro",
    descripcion: "Quién responde del producto.",
  },
  {
    id: "sector",
    nombre: "Menciones específicas",
    descripcion: "Lo que exige la normativa de este tipo de producto.",
  },
];

export const ESTADOS: Record<
  EstadoRequisito,
  { nombre: string; descripcion: string }
> = {
  pendiente: { nombre: "Pendiente", descripcion: "Aún no tenemos este dato." },
  recibido: { nombre: "Recibido", descripcion: "Documento adjuntado, sin analizar." },
  analizando: { nombre: "Analizando", descripcion: "Leyendo el documento…" },
  verificado: { nombre: "Verificado", descripcion: "Dato comprobado y listo para la etiqueta." },
  incidencia: { nombre: "Incidencia", descripcion: "Necesita revisión manual." },
  no_aplica: { nombre: "No aplica", descripcion: "No procede para este producto." },
};

/** Menciones de la matriz que ya representamos como requisitos propios. */
const MENCIONES_BASE_CUBIERTAS = new Set([
  "denominacion",
  "lista_ingredientes",
  "alergenos",
  "cantidad_neta",
  "fecha_duracion",
  "lote",
  "responsable",
  "info_nutricional",
  "conservacion",
]);

/* ------------------------------------------------------------------ */
/* Construcción dinámica de requisitos                                  */
/* ------------------------------------------------------------------ */

function desdeMencion(m: Mencion, fase: FaseId, motivo: string): Requisito {
  return {
    id: m.id,
    fase,
    titulo: m.etiquetaCorta,
    descripcion: m.explicacion,
    comoSeCubre: m.preguntaUsuario,
    baseLegal: m.baseLegal,
    obligatoria: m.obligatoria,
    origen: m.tipo === "dato" ? "dato" : "declaracion",
    motivo,
  };
}

/**
 * Lista de requisitos para un producto. Cambia con el sector y las
 * certificaciones: no todos los productos necesitan lo mismo.
 */
export function construirRequisitos(
  sectorId: string,
  certIds: string[],
  atributos: Atributos,
): Requisito[] {
  const sector = getSector(sectorId);
  const general = "Reg. (UE) 1169/2011";
  const perecedero = atributos.conservacion === "refrigerado";

  const base: Requisito[] = [
    {
      id: "denominacion",
      fase: "producto",
      titulo: "Nombre del producto",
      descripcion:
        "Denominación legal o, si no existe, la habitual o descriptiva. Es lo primero que identifica el producto en la etiqueta.",
      comoSeCubre: "Nos lo indica el cliente en el chat o aparece en la ficha técnica del proveedor.",
      baseLegal: `${general}, art. 9.1.a y 17`,
      obligatoria: true,
      origen: "dato",
      motivo: "Obligatorio para todos los alimentos",
    },
    {
      id: "foto_producto",
      fase: "producto",
      titulo: "Foto del producto",
      descripcion:
        "Imagen del producto o del envase actual. Sirve para revisar el diseño y contrastar lo que ya figura impreso.",
      comoSeCubre: "Adjunta una foto (JPG o PNG) en el chat.",
      obligatoria: false,
      origen: "documento",
      motivo: "Recomendado para la revisión",
    },
    {
      id: "ean",
      fase: "producto",
      titulo: "Código EAN",
      descripcion: "Código de barras de 8 o 13 dígitos para la distribución.",
      comoSeCubre: "Escribe el código en el chat o aparece en la ficha del proveedor.",
      obligatoria: false,
      origen: "dato",
      motivo: "Criterio del cliente / distribución",
    },
    {
      id: "lista_ingredientes",
      fase: "producto",
      titulo: "Ingredientes y cantidades",
      descripcion:
        "Lista completa en orden decreciente de peso, con el porcentaje de los ingredientes destacados (QUID).",
      comoSeCubre: "Se extrae de la ficha técnica del proveedor o de la receta.",
      baseLegal: `${general}, art. 9.1.b, 18 y 22`,
      obligatoria: true,
      origen: "documento",
      motivo: "Obligatorio para todos los alimentos",
    },
    {
      id: "ft_proveedor",
      fase: "producto",
      titulo: "Ficha técnica del proveedor",
      descripcion:
        "Documento fuente principal: de aquí sacamos ingredientes, alérgenos, trazas, envase y datos del fabricante.",
      comoSeCubre: "Adjunta el PDF de la ficha técnica en el chat.",
      obligatoria: false,
      origen: "documento",
      motivo: "Fuente de información",
    },
    {
      id: "cantidad_neta",
      fase: "producto",
      titulo: "Cantidad neta",
      descripcion: "Peso o volumen neto en g, kg, ml o l, en el mismo campo visual que la denominación.",
      comoSeCubre: "Ficha del proveedor o dato del cliente.",
      baseLegal: `${general}, art. 9.1.e y 23, Anexo IX`,
      obligatoria: true,
      origen: "dato",
      motivo: "Obligatorio para todos los alimentos",
    },
    {
      id: "lote",
      fase: "producto",
      titulo: "Lote",
      descripcion: "Identificación del lote, precedida de la letra L salvo que se distinga claramente.",
      comoSeCubre: "Lo define el cliente o el envasador.",
      baseLegal: "RD 2207/1995",
      obligatoria: true,
      origen: "dato",
      motivo: "Obligatorio para todos los alimentos",
    },
    {
      id: "fecha_duracion",
      fase: "producto",
      titulo: perecedero ? "Fecha de caducidad" : "Fecha de consumo preferente",
      descripcion: perecedero
        ? "Producto muy perecedero: lleva «fecha de caducidad» (día y mes). Tras esa fecha no se considera seguro."
        : "Fecha de duración mínima: «consumir preferentemente antes del…» o «…antes del fin de…» según la duración.",
      comoSeCubre: "Se deduce del estudio de vida útil.",
      baseLegal: `${general}, art. 9.1.f y 24, Anexo X`,
      obligatoria: true,
      origen: "dato",
      motivo: perecedero ? "Refrigerado: caducidad en vez de consumo preferente" : "Obligatorio para todos los alimentos",
    },
    {
      id: "alergenos",
      fase: "declaraciones",
      titulo: "Alérgenos y trazas",
      descripcion:
        "Los 14 alérgenos del Anexo II deben destacarse en la lista de ingredientes; las trazas se indican con «puede contener».",
      comoSeCubre: "Se extraen de la ficha técnica del proveedor y se confirman en el chat.",
      baseLegal: `${general}, art. 9.1.c y 21, Anexo II`,
      obligatoria: true,
      origen: "declaracion",
      motivo: "Obligatorio para todos los alimentos",
    },
    {
      id: "tipo_envase",
      fase: "envase",
      titulo: "Tipo de envase",
      descripcion: "Material y formato del envase; condiciona el espacio disponible y algunas menciones.",
      comoSeCubre: "Ficha del proveedor o dato del cliente.",
      obligatoria: false,
      origen: "dato",
      motivo: "Criterio del cliente",
    },
    {
      id: "paletizado",
      fase: "envase",
      titulo: "Paletizado",
      descripcion: "Unidades por caja y cajas por palé, para la etiqueta logística.",
      comoSeCubre: "Dato del cliente.",
      obligatoria: false,
      origen: "dato",
      motivo: "Criterio del cliente",
    },
    {
      id: "conservacion",
      fase: "envase",
      titulo: "Condiciones de conservación",
      descripcion:
        "Cómo debe guardarse el producto, cerrado y una vez abierto. Obligatorio cuando el producto lo requiere.",
      comoSeCubre: "Dato del cliente; podemos sugerirlo a partir de productos similares.",
      baseLegal: `${general}, art. 9.1.g y 25`,
      obligatoria: atributos.conservacion !== "ambiente",
      origen: "dato",
      motivo:
        atributos.conservacion !== "ambiente"
          ? `Producto ${atributos.conservacion}: hay que indicar la temperatura de conservación`
          : "Obligatorio si el producto lo requiere",
    },
    {
      id: "transporte",
      fase: "envase",
      titulo: "Condiciones de transporte",
      descripcion: "Temperatura y condiciones durante el transporte, para la ficha logística.",
      comoSeCubre: "Dato del cliente.",
      obligatoria: false,
      origen: "dato",
      motivo: "Criterio del cliente",
    },
    {
      id: "modo_empleo",
      fase: "envase",
      titulo: "Modo de empleo",
      descripcion: "Instrucciones de uso cuando sin ellas no se puede usar bien el producto.",
      comoSeCubre: "Dato del cliente.",
      baseLegal: `${general}, art. 9.1.j y 27`,
      obligatoria: !atributos.listoParaConsumo,
      origen: "dato",
      motivo: atributos.listoParaConsumo
        ? "Obligatorio si el producto lo requiere"
        : "Requiere preparación: hay que indicar cómo cocinarlo o prepararlo",
    },
    {
      id: "responsable",
      fase: "legal",
      titulo: "Empresa responsable y dirección",
      descripcion: "Nombre o razón social y dirección del operador responsable de la información alimentaria (envasador o vendedor).",
      comoSeCubre: "Dato del cliente o ficha del proveedor.",
      baseLegal: `${general}, art. 9.1.h y 8`,
      obligatoria: true,
      origen: "dato",
      motivo: "Obligatorio para todos los alimentos",
    },
    {
      id: "registro_sanitario",
      fase: "legal",
      titulo: "Registro sanitario (RGSEAA)",
      descripcion: "Número de Registro General Sanitario de Empresas Alimentarias y Alimentos del envasador.",
      comoSeCubre: "Dato del cliente.",
      baseLegal: "RD 191/2011",
      obligatoria: true,
      origen: "dato",
      motivo: "Obligatorio en España",
    },
  ];

  const extras: Requisito[] = [];
  const vistos = new Set<string>(base.map((r) => r.id));

  // Análisis de laboratorio: catálogo completo evaluado para este producto.
  for (const a of evaluarAnalisis({ sectorId, certIds, atributos })) {
    if (!a.aplica) continue;
    vistos.add(a.id);
    extras.push({
      id: a.id,
      fase: "laboratorio",
      titulo: a.titulo,
      descripcion: a.descripcion,
      comoSeCubre: a.comoSeCubre,
      baseLegal: a.baseLegal,
      obligatoria: a.obligatoria,
      origen: "documento",
      motivo: a.motivo,
      parametros: a.parametros,
      nota: a.nota,
    });
  }

  for (const id of sector?.mencionesExtra ?? []) {
    const m = mencionPorId(id);
    if (!m || vistos.has(id) || MENCIONES_BASE_CUBIERTAS.has(id)) continue;
    if (id === "fecha_congelacion" && atributos.conservacion !== "congelado") continue;
    if (id === "peso_escurrido" && !atributos.liquidoCobertura) continue;
    if (id === "grado_alcoholico" && !atributos.contieneAlcohol) continue;
    vistos.add(id);
    extras.push(desdeMencion(m, "sector", `Por el sector ${sector?.nombre}`));
  }

  for (const cid of certIds) {
    const cert = getCertificacion(cid);
    if (!cert) continue;
    for (const id of cert.mencionesExtra) {
      const m = mencionPorId(id);
      if (!m || vistos.has(id) || MENCIONES_BASE_CUBIERTAS.has(id)) continue;
      vistos.add(id);
      extras.push(desdeMencion(m, "sector", `Por la certificación ${cert.nombre}`));
    }
    if (cid === "claims_salud" && !vistos.has("analitica_claims")) {
      vistos.add("analitica_claims");
      extras.push({
        id: "analitica_claims",
        fase: "laboratorio",
        titulo: "Analítica que respalda las declaraciones",
        descripcion:
          "Cada declaración nutricional o de salud debe respaldarse con valores analíticos que cumplan las condiciones del Reglamento.",
        comoSeCubre: "Adjunta el informe del laboratorio; contrastamos los valores con el Reg. 1924/2006.",
        baseLegal: "Reg. (CE) 1924/2006 y Reg. (UE) 432/2012",
        obligatoria: true,
        origen: "documento",
        motivo: "Por la certificación Con declaraciones nutricionales/de salud",
      });
    }
  }

  // Menciones condicionadas por atributos que el sector no aporta por sí mismo.
  const condicionales: [boolean, string, string][] = [
    [atributos.contieneAlcohol, "grado_alcoholico", "Contiene más de 1,2 % vol."],
    [atributos.conservacion === "congelado", "fecha_congelacion", "Producto congelado"],
    [atributos.liquidoCobertura, "peso_escurrido", "Va en líquido de cobertura"],
  ];
  for (const [cond, id, motivo] of condicionales) {
    const m = mencionPorId(id);
    if (!cond || !m || vistos.has(id)) continue;
    vistos.add(id);
    extras.push(desdeMencion(m, "declaraciones", motivo));
  }

  return [...base, ...extras];
}

/** Análisis y menciones que NO aplican a este producto, con el motivo (para mostrar por qué no están). */
export function requisitosExcluidos(
  sectorId: string,
  certIds: string[],
  atributos: Atributos,
): Excluido[] {
  const out: Excluido[] = [];
  for (const a of evaluarAnalisis({ sectorId, certIds, atributos })) {
    if (!a.aplica) out.push({ id: a.id, titulo: a.titulo, fase: "laboratorio", motivo: a.motivo });
  }
  const sector = getSector(sectorId);
  const porAtributo: [string, boolean, string][] = [
    ["fecha_congelacion", atributos.conservacion !== "congelado", "No es un producto congelado"],
    ["peso_escurrido", !atributos.liquidoCobertura, "No va en líquido de cobertura"],
    ["grado_alcoholico", !atributos.contieneAlcohol, "No contiene más de 1,2 % vol."],
  ];
  for (const [id, excluir, motivo] of porAtributo) {
    if (!excluir || !sector?.mencionesExtra.includes(id)) continue;
    const m = mencionPorId(id);
    if (m) out.push({ id, titulo: m.etiquetaCorta, fase: "sector", motivo });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                           */
/* ------------------------------------------------------------------ */

export function estadoVacio(): EstadoItem {
  return { estado: "pendiente", documentoIds: [], datos: [] };
}

export function tipoDocumento(nombre: string): Documento["tipo"] {
  const ext = nombre.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "webp", "heic", "gif"].includes(ext)) return "imagen";
  if (["xls", "xlsx", "csv", "ods"].includes(ext)) return "hoja";
  return "otro";
}

export function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("es-ES", { maximumFractionDigits: 1 })} MB`;
}

export function horaCorta(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type Resumen = {
  total: number;
  obligatorios: number;
  obligatoriosCubiertos: number;
  cubiertos: number;
  pendientes: number;
  incidencias: number;
};

export function resumir(
  requisitos: Requisito[],
  estados: Record<string, EstadoItem>,
): Resumen {
  let obligatorios = 0;
  let obligatoriosCubiertos = 0;
  let cubiertos = 0;
  let pendientes = 0;
  let incidencias = 0;
  for (const r of requisitos) {
    const e = estados[r.id]?.estado ?? "pendiente";
    const cubierto = e === "verificado" || e === "no_aplica";
    if (cubierto) cubiertos += 1;
    if (e === "incidencia") incidencias += 1;
    if (e === "pendiente" || e === "recibido" || e === "analizando") pendientes += 1;
    if (r.obligatoria) {
      obligatorios += 1;
      if (cubierto) obligatoriosCubiertos += 1;
    }
  }
  return {
    total: requisitos.length,
    obligatorios,
    obligatoriosCubiertos,
    cubiertos,
    pendientes,
    incidencias,
  };
}
