/**
 * Escenarios de demostración: el mismo espacio de trabajo en tres momentos.
 *
 *  - vacio:    producto recién creado, sin documentos ni datos.
 *  - en_curso: a mitad de trabajo (el escenario por defecto).
 *  - completo: todo aprobado por la consultora; la etiqueta se puede generar.
 *
 * Solo sirven para la maqueta. En la app real el estado vendrá del backend.
 */

import type { Atributos, Documento, EstadoItem, Mensaje } from "@/lib/workspace";
import { ATRIBUTOS_POR_DEFECTO } from "@/lib/workspace";
import {
  DEMO_DOCUMENTOS,
  DEMO_ESTADOS,
  DEMO_MENSAJES,
  DEMO_PRODUCTO,
  DEMO_USUARIO,
} from "@/lib/demo";

export type EscenarioId = "vacio" | "en_curso" | "completo";

export const ESCENARIOS: { id: EscenarioId; nombre: string; descripcion: string }[] = [
  { id: "vacio", nombre: "Producto nuevo", descripcion: "Sin documentos ni datos." },
  { id: "en_curso", nombre: "En curso", descripcion: "A mitad de trabajo." },
  { id: "completo", nombre: "Completo", descripcion: "Todo aprobado; etiqueta lista." },
];

export type Escenario = {
  id: EscenarioId;
  producto: { nombre: string; cliente: string; sectorId: string; certificaciones: string[] };
  atributos: Atributos;
  estados: Record<string, EstadoItem>;
  documentos: Documento[];
  mensajes: Mensaje[];
};

const hora = (h: number, m: number) =>
  `2026-09-15T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
const firma = (h: number, m: number) => ({ por: DEMO_USUARIO.nombre, fecha: hora(h, m) });

export function esEscenario(v: unknown): v is EscenarioId {
  return v === "vacio" || v === "en_curso" || v === "completo";
}

export function cargarEscenario(id: EscenarioId): Escenario {
  if (id === "vacio") return vacio();
  if (id === "completo") return completo();
  return {
    id: "en_curso",
    producto: {
      nombre: DEMO_PRODUCTO.nombre,
      cliente: DEMO_PRODUCTO.cliente,
      sectorId: DEMO_PRODUCTO.sectorId,
      certificaciones: DEMO_PRODUCTO.certificaciones,
    },
    atributos: DEMO_PRODUCTO.atributos,
    estados: DEMO_ESTADOS,
    documentos: DEMO_DOCUMENTOS,
    mensajes: DEMO_MENSAJES,
  };
}

/* ------------------------------------------------------------------ */

function vacio(): Escenario {
  return {
    id: "vacio",
    producto: { nombre: "", cliente: "Conservas del Sur, S.L.", sectorId: "no_clasificado", certificaciones: [] },
    atributos: ATRIBUTOS_POR_DEFECTO,
    estados: {},
    documentos: [],
    mensajes: [
      {
        id: "v1",
        autor: "asistente",
        hora: hora(9, 40),
        texto:
          "Hola, Laura. Vamos a preparar la etiqueta de un producto nuevo para Conservas del Sur.\n\nPara empezar necesito dos cosas: que me digas qué producto es (nombre, formato, cómo se conserva) y que adjuntes lo que ya tengas, sobre todo la ficha técnica del proveedor. Con eso clasifico el producto, fijo su perfil y te digo exactamente qué requisitos y qué análisis de laboratorio le aplican.\n\nMientras tanto, a la izquierda tienes la lista base que exige el Reglamento 1169/2011 a cualquier alimento envasado.",
      },
    ],
  };
}

/* ------------------------------------------------------------------ */

function completo(): Escenario {
  const docs: Documento[] = [
    ...DEMO_DOCUMENTOS.filter((d) => d.id !== "doc_micro"),
    {
      id: "doc_micro2",
      nombre: "Analisis_microbiologico_L2026-014_original.pdf",
      tipo: "pdf",
      tamano: 380_000,
      subidoEn: hora(11, 5),
      paginas: 2,
      legible: true,
      resumen: "Informe original del laboratorio (con texto). Todos los parámetros dentro de los criterios del Reg. 2073/2005.",
      extractos: [
        { etiqueta: "Mohos y levaduras", valor: "< 10 ufc/g" },
        { etiqueta: "Salmonella", valor: "Ausencia en 25 g" },
        { etiqueta: "Listeria monocytogenes", valor: "Ausencia en 25 g" },
        { etiqueta: "Aerobios mesófilos", valor: "< 100 ufc/g" },
      ],
    },
    {
      id: "doc_contaminantes",
      nombre: "Informe_contaminantes_2026-0418.pdf",
      tipo: "pdf",
      tamano: 720_000,
      subidoEn: hora(11, 20),
      paginas: 3,
      legible: true,
      resumen: "Metales pesados y patulina por debajo de los límites del Reg. (UE) 2023/915.",
      extractos: [
        { etiqueta: "Plomo", valor: "< 0,02 mg/kg (límite 0,10)" },
        { etiqueta: "Cadmio", valor: "< 0,01 mg/kg" },
        { etiqueta: "Patulina", valor: "No detectada" },
      ],
    },
    {
      id: "doc_plaguicidas",
      nombre: "Informe_multirresiduos_fresa_2026-0419.pdf",
      tipo: "pdf",
      tamano: 1_100_000,
      subidoEn: hora(11, 20),
      paginas: 6,
      legible: true,
      resumen: "Barrido multirresiduos (LC-MS/MS y GC-MS/MS) sobre la fresa: todos los residuos por debajo del LMR.",
      extractos: [
        { etiqueta: "Sustancias analizadas", valor: "412" },
        { etiqueta: "Detectadas", valor: "2 (boscalida, fludioxonil), ambas < 10 % del LMR" },
      ],
    },
    {
      id: "doc_foto",
      nombre: "Foto_tarro_250g.jpg",
      tipo: "imagen",
      tamano: 2_400_000,
      subidoEn: hora(11, 32),
      legible: true,
      resumen: "Foto del tarro actual con la etiqueta antigua. Sirve de referencia para el diseño.",
      extractos: [],
    },
    {
      id: "doc_artesano",
      nombre: "Certificado_artesano_Junta_Andalucia.pdf",
      tipo: "pdf",
      tamano: 540_000,
      subidoEn: hora(11, 40),
      paginas: 1,
      legible: true,
      resumen: "Inscripción en el Registro de Artesanía Alimentaria de Andalucía, vigente hasta 2028.",
      extractos: [{ etiqueta: "Nº registro artesano", valor: "AA-SE-0417" }],
    },
  ];

  const base: Record<string, EstadoItem> = {
    ...DEMO_ESTADOS,
    foto_producto: { estado: "aprobado", documentoIds: ["doc_foto"], datos: [], aprobacion: firma(11, 33) },
    lote: { estado: "aprobado", documentoIds: [], datos: [{ etiqueta: "Lote", valor: "L2026-014" }], aprobacion: firma(10, 32) },
    registro_sanitario: {
      estado: "aprobado",
      documentoIds: [],
      datos: [{ etiqueta: "Nº RGSEAA", valor: "21.012345/SE" }],
      aprobacion: firma(10, 31),
    },
    conservacion: {
      estado: "aprobado",
      documentoIds: ["doc_vida"],
      datos: [{ etiqueta: "Conservación", valor: "Conservar en lugar fresco y seco. Una vez abierto, mantener refrigerado y consumir en 4 semanas." }],
      aprobacion: firma(10, 45),
    },
    paletizado: {
      estado: "aprobado",
      documentoIds: [],
      datos: [{ etiqueta: "Paletizado", valor: "12 tarros por caja · 84 cajas por palé (europalé, 7 alturas)" }],
      aprobacion: firma(10, 50),
    },
    transporte: {
      estado: "aprobado",
      documentoIds: [],
      datos: [{ etiqueta: "Transporte", valor: "Temperatura ambiente, protegido de la luz directa" }],
      aprobacion: firma(10, 50),
    },
    modo_empleo: {
      estado: "no_aplica",
      documentoIds: [],
      datos: [],
      nota: "Producto listo para consumir; no necesita instrucciones.",
      aprobacion: firma(10, 51),
    },
    lab_microbiologico: {
      estado: "aprobado",
      documentoIds: ["doc_micro2"],
      datos: [
        { etiqueta: "Mohos y levaduras", valor: "< 10 ufc/g" },
        { etiqueta: "Salmonella / Listeria", valor: "Ausencia en 25 g" },
      ],
      aprobacion: firma(11, 8),
    },
    lab_contaminantes: {
      estado: "aprobado",
      documentoIds: ["doc_contaminantes"],
      datos: [
        { etiqueta: "Plomo", valor: "< 0,02 mg/kg" },
        { etiqueta: "Cadmio", valor: "< 0,01 mg/kg" },
        { etiqueta: "Patulina", valor: "No detectada" },
      ],
      aprobacion: firma(11, 25),
    },
    lab_plaguicidas: {
      estado: "aprobado",
      documentoIds: ["doc_plaguicidas"],
      datos: [{ etiqueta: "Multirresiduos", valor: "412 sustancias · todas < LMR" }],
      aprobacion: firma(11, 26),
    },
    artesano_justificado: {
      estado: "aprobado",
      documentoIds: ["doc_artesano"],
      datos: [{ etiqueta: "Registro artesano", valor: "AA-SE-0417 · Junta de Andalucía" }],
      aprobacion: firma(11, 42),
    },
  };

  // Todo lo que quedaba por confirmar o sin firma pasa a aprobado / descartado con firma.
  const estados: Record<string, EstadoItem> = {};
  let minuto = 0;
  for (const [id, it] of Object.entries(base)) {
    if (it.estado === "verificado") {
      estados[id] = { ...it, estado: "aprobado", nota: undefined, aprobacion: firma(11, 45 + (minuto++ % 10)) };
    } else if (it.estado === "no_aplica" && !it.aprobacion) {
      estados[id] = { ...it, aprobacion: firma(11, 45 + (minuto++ % 10)) };
    } else {
      estados[id] = it;
    }
  }

  const mensajes: Mensaje[] = [
    ...DEMO_MENSAJES,
    {
      id: "c1",
      autor: "usuario",
      hora: hora(10, 30),
      texto: "El RGSEAA es 21.012345/SE y el lote L2026-014. Paletizado: 12 tarros por caja, 84 cajas por palé.",
    },
    {
      id: "c2",
      autor: "asistente",
      hora: hora(10, 31),
      texto: "Anotado: registro sanitario, lote y paletizado quedan por confirmar en sus fichas.",
      requisitosRef: ["registro_sanitario", "lote", "paletizado"],
    },
    {
      id: "c3",
      autor: "usuario",
      hora: hora(11, 5),
      texto: "Aquí va el microbiológico original del laboratorio, los informes de contaminantes y multirresiduos, la foto del tarro y el certificado de artesano.",
      adjuntos: ["doc_micro2", "doc_contaminantes", "doc_plaguicidas", "doc_foto", "doc_artesano"],
    },
    {
      id: "c4",
      autor: "asistente",
      hora: hora(11, 7),
      texto:
        "Ahora sí he podido leer el microbiológico: todos los parámetros dentro de los criterios del Reg. 2073/2005, así que retiro la incidencia. Contaminantes y multirresiduos por debajo de los límites. El certificado de artesano (AA-SE-0417) justifica la mención.\n\nCon esto ya no falta ningún requisito. Te quedan 11 por confirmar en la cola de la vista previa.",
      requisitosRef: ["lab_microbiologico", "lab_contaminantes", "lab_plaguicidas", "artesano_justificado", "foto_producto"],
    },
    {
      id: "c5",
      autor: "asistente",
      hora: hora(11, 55),
      texto:
        "Todos los requisitos obligatorios están aprobados por ti. La etiqueta está lista para generar: ficha técnica y arte final con los datos firmados.",
    },
  ];

  return {
    id: "completo",
    producto: {
      nombre: DEMO_PRODUCTO.nombre,
      cliente: DEMO_PRODUCTO.cliente,
      sectorId: DEMO_PRODUCTO.sectorId,
      certificaciones: DEMO_PRODUCTO.certificaciones,
    },
    atributos: DEMO_PRODUCTO.atributos,
    estados,
    documentos: docs,
    mensajes,
  };
}
