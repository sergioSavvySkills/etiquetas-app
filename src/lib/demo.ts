/**
 * Datos de demostración para el espacio de trabajo (solo UI).
 * Producto: mermelada artesanal de fresa, 250 g.
 */

import type { Atributos, Documento, EstadoItem, Mensaje } from "@/lib/workspace";

/** Fecha local fija (sin zona) para que servidor y cliente pinten la misma hora. */
const enHora = (h: number, m: number) =>
  `2026-09-15T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;

export const DEMO_PRODUCTO = {
  nombre: "Mermelada artesanal de fresa",
  cliente: "Conservas del Sur, S.L.",
  sectorId: "frutas_hortalizas",
  certificaciones: ["artesano"],
  atributos: {
    conservacion: "ambiente",
    listoParaConsumo: true,
    contieneAlcohol: false,
    llevaClaims: false,
    liquidoCobertura: false,
    ingredienteUnicoSinTransformar: false,
  } satisfies Atributos,
};

export const DEMO_DOCUMENTOS: Documento[] = [
  {
    id: "doc_ft",
    nombre: "FT_Proveedor_Mermelada_Fresa_v3.pdf",
    tipo: "pdf",
    tamano: 842_000,
    subidoEn: enHora(9, 42),
    paginas: 4,
    legible: true,
    resumen:
      "Ficha técnica del proveedor. Incluye composición con porcentajes, alérgenos y trazas, formato de envase y datos del fabricante.",
    extractos: [
      { etiqueta: "Ingredientes", valor: "Fresa 55 %, azúcar 43 %, pectina 1,5 %, ácido cítrico 0,5 %" },
      { etiqueta: "Alérgenos", valor: "No contiene" },
      { etiqueta: "Trazas", valor: "Puede contener frutos de cáscara" },
      { etiqueta: "Envase", valor: "Tarro de vidrio 250 g con tapa twist-off" },
      { etiqueta: "Fruta por 100 g", valor: "55 g" },
      { etiqueta: "Fabricante", valor: "Conservas del Sur, S.L. · Pol. Ind. La Vega, 11 · 41560 Estepa (Sevilla)" },
    ],
  },
  {
    id: "doc_nutri",
    nombre: "Informe_nutricional_2026-0412.pdf",
    tipo: "pdf",
    tamano: 1_260_000,
    subidoEn: enHora(9, 42),
    paginas: 3,
    legible: true,
    resumen:
      "Informe de laboratorio externo (Analítica Sur, nº 2026/0412). Valores por 100 g. Ya ordenados según el Reg. 1169/2011.",
    extractos: [
      { etiqueta: "Valor energético", valor: "912 kJ / 215 kcal" },
      { etiqueta: "Grasas", valor: "0,2 g" },
      { etiqueta: "de las cuales saturadas", valor: "0,1 g" },
      { etiqueta: "Hidratos de carbono", valor: "52 g" },
      { etiqueta: "de los cuales azúcares", valor: "50 g" },
      { etiqueta: "Fibra alimentaria", valor: "1,1 g" },
      { etiqueta: "Proteínas", valor: "0,4 g" },
      { etiqueta: "Sal", valor: "0,02 g" },
    ],
  },
  {
    id: "doc_vida",
    nombre: "Estudio_vida_util_mermelada.pdf",
    tipo: "pdf",
    tamano: 2_050_000,
    subidoEn: enHora(10, 15),
    paginas: 11,
    legible: true,
    resumen:
      "Estudio de vida útil acelerado. Concluye 24 meses a temperatura ambiente en envase cerrado.",
    extractos: [
      { etiqueta: "Vida útil", valor: "24 meses desde la fabricación" },
      { etiqueta: "Condiciones", valor: "Ambiente, envase cerrado; refrigerar una vez abierto" },
      { etiqueta: "Tipo de fecha", valor: "Consumo preferente (no caducidad)" },
    ],
  },
  {
    id: "doc_fq",
    nombre: "Informe_fisicoquimico_2026-0413.pdf",
    tipo: "pdf",
    tamano: 610_000,
    subidoEn: enHora(9, 42),
    paginas: 2,
    legible: true,
    resumen:
      "Boletín físico-químico del mismo laboratorio. Los valores cumplen el RD 670/1990 para «confitura extra» (≥ 45 g de fruta y ≥ 60 °Brix).",
    extractos: [
      { etiqueta: "Sólidos solubles", valor: "65 °Brix" },
      { etiqueta: "Fruta por 100 g", valor: "55 g" },
      { etiqueta: "pH", valor: "3,2" },
      { etiqueta: "Actividad de agua (Aw)", valor: "0,82" },
    ],
  },
  {
    id: "doc_micro",
    nombre: "Analisis_microbiologico_L2026-014.pdf",
    tipo: "pdf",
    tamano: 4_700_000,
    subidoEn: enHora(10, 15),
    paginas: 2,
    legible: false,
    resumen:
      "El PDF es un escaneado sin capa de texto. No he podido leer los parámetros.",
    extractos: [],
  },
];

export const DEMO_ESTADOS: Record<string, EstadoItem> = {
  denominacion: {
    estado: "verificado",
    documentoIds: [],
    datos: [
      { etiqueta: "Nombre comercial", valor: "Mermelada artesanal de fresa" },
      { etiqueta: "Denominación legal", valor: "Confitura extra de fresa" },
    ],
  },
  foto_producto: { estado: "pendiente", documentoIds: [], datos: [] },
  ean: {
    estado: "verificado",
    documentoIds: [],
    datos: [{ etiqueta: "EAN-13", valor: "8412345678905" }],
  },
  lista_ingredientes: {
    estado: "verificado",
    documentoIds: ["doc_ft"],
    datos: [
      { etiqueta: "Ingredientes", valor: "Fresa (55 %), azúcar, gelificante (pectina), acidulante (ácido cítrico)" },
    ],
  },
  ft_proveedor: { estado: "verificado", documentoIds: ["doc_ft"], datos: [] },
  cantidad_neta: {
    estado: "verificado",
    documentoIds: ["doc_ft"],
    datos: [{ etiqueta: "Cantidad neta", valor: "250 g" }],
  },
  lote: { estado: "pendiente", documentoIds: [], datos: [] },
  fecha_duracion: {
    estado: "verificado",
    documentoIds: ["doc_vida"],
    datos: [
      { etiqueta: "Mención propuesta", valor: "Consumir preferentemente antes del fin de: ver tapa" },
      { etiqueta: "Base", valor: "24 meses según estudio de vida útil" },
    ],
  },
  lab_nutricional: {
    estado: "verificado",
    documentoIds: ["doc_nutri"],
    datos: [
      { etiqueta: "Valor energético", valor: "912 kJ / 215 kcal" },
      { etiqueta: "Grasas", valor: "0,2 g" },
      { etiqueta: "de las cuales saturadas", valor: "0,1 g" },
      { etiqueta: "Hidratos de carbono", valor: "52 g" },
      { etiqueta: "de los cuales azúcares", valor: "50 g" },
      { etiqueta: "Fibra alimentaria", valor: "1,1 g" },
      { etiqueta: "Proteínas", valor: "0,4 g" },
      { etiqueta: "Sal", valor: "0,02 g" },
    ],
  },
  lab_vida_util: {
    estado: "verificado",
    documentoIds: ["doc_vida"],
    datos: [{ etiqueta: "Vida útil", valor: "24 meses desde la fabricación" }],
  },
  lab_fisicoquimico: {
    estado: "verificado",
    documentoIds: ["doc_fq"],
    datos: [
      { etiqueta: "Sólidos solubles", valor: "65 °Brix" },
      { etiqueta: "Fruta por 100 g", valor: "55 g" },
      { etiqueta: "pH / Aw", valor: "3,2 / 0,82" },
      { etiqueta: "Cumple", valor: "RD 670/1990 · categoría «confitura extra»" },
    ],
  },
  lab_contaminantes: { estado: "pendiente", documentoIds: [], datos: [] },
  lab_plaguicidas: { estado: "pendiente", documentoIds: [], datos: [] },
  lab_microbiologico: {
    estado: "incidencia",
    documentoIds: ["doc_micro"],
    datos: [],
    nota: "El PDF es un escaneado sin texto y no se puede leer. Pide al laboratorio el original o introduce los parámetros a mano.",
  },
  alergenos: {
    estado: "verificado",
    documentoIds: ["doc_ft"],
    datos: [
      { etiqueta: "Contiene", valor: "Ninguno de los 14 alérgenos" },
      { etiqueta: "Puede contener", valor: "Frutos de cáscara" },
    ],
  },
  tipo_envase: {
    estado: "verificado",
    documentoIds: ["doc_ft"],
    datos: [{ etiqueta: "Envase", valor: "Tarro de vidrio 250 g con tapa twist-off" }],
  },
  paletizado: { estado: "pendiente", documentoIds: [], datos: [] },
  conservacion: {
    estado: "analizando",
    documentoIds: ["doc_vida"],
    datos: [],
    nota: "Proponiendo redacción a partir del estudio de vida útil.",
  },
  transporte: { estado: "pendiente", documentoIds: [], datos: [] },
  modo_empleo: { estado: "pendiente", documentoIds: [], datos: [] },
  responsable: {
    estado: "verificado",
    documentoIds: ["doc_ft"],
    datos: [
      { etiqueta: "Responsable", valor: "Conservas del Sur, S.L." },
      { etiqueta: "Dirección", valor: "Pol. Ind. La Vega, 11 · 41560 Estepa (Sevilla) · España" },
    ],
  },
  registro_sanitario: { estado: "pendiente", documentoIds: [], datos: [] },
  categoria_comercial: {
    estado: "no_aplica",
    documentoIds: [],
    datos: [],
    nota: "Solo para frutas y hortalizas frescas. No procede en confituras.",
  },
  peso_escurrido: {
    estado: "no_aplica",
    documentoIds: [],
    datos: [],
    nota: "No hay líquido de cobertura.",
  },
  porcentaje_fruta: {
    estado: "verificado",
    documentoIds: ["doc_ft", "doc_fq"],
    datos: [
      { etiqueta: "Mención", valor: "Elaborado con 55 g de fruta por 100 g" },
      { etiqueta: "Azúcares totales", valor: "Contenido total de azúcares: 65 g por 100 g" },
    ],
  },
  aviso_sulfitos: {
    estado: "no_aplica",
    documentoIds: ["doc_ft"],
    datos: [],
    nota: "Sin sulfitos según la ficha técnica.",
  },
  zumo_denominacion: {
    estado: "no_aplica",
    documentoIds: [],
    datos: [],
    nota: "No es un zumo.",
  },
  ultracongelado: {
    estado: "no_aplica",
    documentoIds: [],
    datos: [],
    nota: "Producto a temperatura ambiente.",
  },
  artesano_justificado: { estado: "pendiente", documentoIds: [], datos: [] },
};

export const DEMO_MENSAJES: Mensaje[] = [
  {
    id: "m1",
    autor: "asistente",
    hora: enHora(9, 40),
    texto:
      "Hola. Voy a ayudarte a preparar la etiqueta de este producto. Cuéntame qué es y adjunta lo que tengas: ficha técnica del proveedor, analíticas de laboratorio, foto del envase… A la izquierda irás viendo qué requisitos quedan cubiertos y cuáles faltan.",
  },
  {
    id: "m2",
    autor: "usuario",
    hora: enHora(9, 42),
    texto:
      "Es una mermelada artesanal de fresa en tarro de 250 g, se conserva a temperatura ambiente. Os paso la ficha técnica del proveedor y las analíticas nutricional y físico-química.",
    adjuntos: ["doc_ft", "doc_nutri", "doc_fq"],
  },
  {
    id: "m3",
    autor: "asistente",
    hora: enHora(9, 43),
    texto:
      "He clasificado el producto como Frutas, hortalizas y derivados (confituras) y he activado la mención de producto artesano. Perfil: ambiente, listo para consumo, sin alcohol ni claims. Con eso, los análisis que le aplican son nutricional, vida útil, físico-químico (RD 670/1990), contaminantes y residuos de plaguicidas; el microbiológico queda como recomendado. No aplican grado alcohólico, OMG, alérgenos analíticos ni sensorial; puedes verlo en «No aplican» del panel izquierdo.\n\nDe la ficha técnica he sacado ingredientes con porcentajes, trazas de frutos de cáscara, el envase y los datos del fabricante. El nutricional está completo y ordenado según el Reglamento. El físico-químico cumple «confitura extra»: 65 °Brix y 55 g de fruta por 100 g.",
    requisitosRef: ["lista_ingredientes", "alergenos", "lab_nutricional", "lab_fisicoquimico", "porcentaje_fruta", "responsable"],
  },
  {
    id: "m4",
    autor: "usuario",
    hora: enHora(10, 15),
    texto: "Aquí van el estudio de vida útil y el análisis microbiológico del lote.",
    adjuntos: ["doc_vida", "doc_micro"],
  },
  {
    id: "m5",
    autor: "asistente",
    hora: enHora(10, 16),
    texto:
      "Estudio de vida útil leído: 24 meses a temperatura ambiente. Propongo «Consumir preferentemente antes del fin de: ver tapa» y estoy redactando las condiciones de conservación.\n\nEl análisis microbiológico es un escaneado sin texto y no puedo leerlo. Lo he marcado con incidencia para revisión manual; si tienes el PDF original del laboratorio, adjúntalo y lo vuelvo a intentar.\n\nMe faltan: lote, registro sanitario, los informes de contaminantes y de residuos de plaguicidas, la foto del producto y la justificación de «artesano». ¿Empezamos por el registro sanitario (RGSEAA)?",
    requisitosRef: ["lab_vida_util", "fecha_duracion", "lab_microbiologico", "lab_contaminantes", "lab_plaguicidas", "lote", "registro_sanitario"],
  },
];
