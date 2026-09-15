/**
 * Catálogo de análisis de laboratorio y reglas de aplicabilidad.
 *
 * Cada análisis decide, a partir del sector, las certificaciones y los
 * atributos del producto, si aplica, si es obligatorio y qué parámetros debe
 * incluir el informe. Así la fase «Análisis de laboratorio» es dinámica: un
 * pan y una anchoa en aceite no piden los mismos informes.
 */

import { getSector } from "@/lib/matriz";

/** Atributos del producto que condicionan requisitos (los deduce el asistente o los fija el usuario). */
export type Atributos = {
  conservacion: "ambiente" | "refrigerado" | "congelado";
  /** Se consume sin cocinar ni tratamiento posterior. */
  listoParaConsumo: boolean;
  /** Más de 1,2 % vol. de alcohol. */
  contieneAlcohol: boolean;
  /** Lleva declaraciones nutricionales o de salud («fuente de fibra», «bajo en sal»…). */
  llevaClaims: boolean;
  /** Va en líquido de cobertura (aceite, salmuera, almíbar…). */
  liquidoCobertura: boolean;
  /** Producto de un solo ingrediente sin transformar (fruta fresca, miel, carne fresca…). */
  ingredienteUnicoSinTransformar: boolean;
};

export const ATRIBUTOS_POR_DEFECTO: Atributos = {
  conservacion: "ambiente",
  listoParaConsumo: true,
  contieneAlcohol: false,
  llevaClaims: false,
  liquidoCobertura: false,
  ingredienteUnicoSinTransformar: false,
};

export type Evaluacion = {
  aplica: boolean;
  obligatoria: boolean;
  /** Por qué aplica (o por qué no). */
  motivo: string;
  /** Qué debe incluir el informe. */
  parametros: string[];
  /** Matiz adicional (p. ej. «puede calcularse»). */
  nota?: string;
};

export type TipoAnalisis = {
  id: string;
  titulo: string;
  descripcion: string;
  comoSeCubre: string;
  baseLegal: string;
  evaluar: (ctx: Contexto) => Evaluacion;
};

export type Contexto = {
  sectorId: string;
  certIds: string[];
  atributos: Atributos;
};

/* ------------------------------------------------------------------ */
/* Tablas por sector                                                    */
/* ------------------------------------------------------------------ */

const nombreSector = (id: string) => getSector(id)?.nombre ?? "este producto";

/** Sectores exentos de información nutricional (Anexo V del Reg. 1169/2011). */
const EXENTOS_NUTRICIONAL = new Set(["aguas_minerales", "cafe_te_infusiones", "bebidas_alcoholicas", "enologicos_vinagres"]);

/** Sectores exentos de fecha de duración (Anexo X). */
const EXENTOS_FECHA = new Set(["aguas_minerales", "enologicos_vinagres"]);

/** Sectores en los que el microbiológico es siempre imprescindible. */
const MICRO_SIEMPRE = new Set([
  "carnico", "pesca", "lacteo", "lacteos_derivados", "huevos_ovoproductos", "elaborados_huevo",
  "platos_preparados", "charcuteria_loncheada", "kits_preparados", "heladeria", "helados_no_lacteos",
  "grupos_especificos", "infantiles_no_lactantes", "productos_mar_especiales", "vegetales_fermentados",
  "bebidas_vegetales", "conservas_gourmet",
]);

const MICRO_PARAMETROS: Record<string, string[]> = {
  carnico: ["Salmonella", "Listeria monocytogenes", "E. coli", "Recuento de aerobios mesófilos", "Enterobacterias"],
  charcuteria_loncheada: ["Listeria monocytogenes", "Salmonella", "Staphylococcus coagulasa +", "Enterobacterias"],
  pesca: ["Histamina", "Listeria monocytogenes", "Salmonella", "E. coli (moluscos)", "Vibrio (según especie)"],
  productos_mar_especiales: ["Histamina", "Listeria monocytogenes", "E. coli", "Vibrio parahaemolyticus"],
  lacteo: ["Listeria monocytogenes", "Salmonella", "Enterobacterias", "Staphylococcus coagulasa +", "E. coli"],
  lacteos_derivados: ["Listeria monocytogenes", "Salmonella", "Enterobacterias", "Staphylococcus coagulasa +"],
  huevos_ovoproductos: ["Salmonella", "Enterobacterias"],
  elaborados_huevo: ["Salmonella", "Listeria monocytogenes", "Enterobacterias"],
  platos_preparados: ["Listeria monocytogenes", "Salmonella", "E. coli", "Bacillus cereus", "Clostridium perfringens"],
  kits_preparados: ["Listeria monocytogenes", "Salmonella", "E. coli"],
  heladeria: ["Listeria monocytogenes", "Salmonella", "Enterobacterias"],
  helados_no_lacteos: ["Listeria monocytogenes", "Salmonella", "Enterobacterias"],
  infantiles_no_lactantes: ["Salmonella", "Cronobacter", "Enterobacterias", "Bacillus cereus"],
  grupos_especificos: ["Salmonella", "Listeria monocytogenes", "Enterobacterias"],
  vegetales_fermentados: ["Listeria monocytogenes", "Salmonella", "E. coli", "Mohos y levaduras"],
  bebidas_vegetales: ["Salmonella", "Listeria monocytogenes", "Enterobacterias", "Bacillus cereus"],
  frutas_hortalizas: ["Salmonella", "E. coli", "Listeria monocytogenes (cortadas / listas para consumo)", "Mohos y levaduras"],
  bebidas_no_alcoholicas: ["Mohos y levaduras", "Recuento de aerobios mesófilos", "Coliformes", "Alicyclobacillus (zumos)"],
  panaderia: ["Mohos y levaduras", "Salmonella (rellenos)", "Bacillus cereus"],
  confiteria: ["Salmonella", "Mohos y levaduras", "Enterobacterias"],
  conservas_gourmet: ["Esterilidad comercial", "Clostridium botulinum (control de proceso)", "Listeria monocytogenes"],
  apicultura: ["Mohos y levaduras", "Clostridium (esporas)"],
};

const MICRO_DEFECTO = ["Listeria monocytogenes (si listo para consumo)", "Salmonella", "Enterobacterias", "Mohos y levaduras", "Recuento de aerobios mesófilos"];

/** Parámetros físico-químicos fijados por normas de calidad. */
const FQ_NORMA: Record<string, { parametros: string[]; base: string }> = {
  aceites_grasas: { parametros: ["Acidez libre", "Índice de peróxidos", "K232 / K270", "Ésteres etílicos", "Ceras"], base: "Reg. (CEE) 2568/91" },
  olivar: { parametros: ["Acidez libre", "Índice de peróxidos", "K232 / K270", "Ésteres etílicos"], base: "Reg. (CEE) 2568/91" },
  apicultura: { parametros: ["Humedad", "HMF", "Actividad diastásica", "Conductividad", "Azúcares (fructosa + glucosa, sacarosa)"], base: "RD 1049/2003" },
  azucar_miel_edulcorantes: { parametros: ["Humedad", "HMF", "Azúcares", "Cenizas"], base: "RD 1049/2003; RD 1052/2003" },
  frutas_hortalizas: { parametros: ["Sólidos solubles (°Brix)", "Fruta por 100 g", "Azúcares totales", "pH", "Actividad de agua (Aw)"], base: "RD 670/1990 (confituras); RD 781/2013 (zumos)" },
  bebidas_no_alcoholicas: { parametros: ["Sólidos solubles (°Brix)", "Acidez", "pH", "Cafeína (si procede)", "Edulcorantes (si procede)"], base: "RD 781/2013; RD 650/2011" },
  bebidas_alcoholicas: { parametros: ["Grado alcohólico", "Acidez total y volátil", "Azúcares residuales", "Sulfuroso total", "Extracto seco"], base: "Reg. (UE) 2019/33; Reg. (UE) 2019/787" },
  enologicos_vinagres: { parametros: ["Acidez total (grado acético)", "Alcohol residual", "Extracto seco"], base: "RD 661/2012" },
  lacteo: { parametros: ["Materia grasa", "Extracto seco magro", "Proteína", "Lactosa", "Punto crioscópico"], base: "Reg. 1308/2013; RD 1054/2003" },
  lacteos_derivados: { parametros: ["Materia grasa", "Extracto seco", "Proteína", "Humedad"], base: "RD 1113/2006 (quesos)" },
  carnico: { parametros: ["Proteína", "Grasa", "Colágeno / proteína", "Humedad", "Sal", "Nitritos / nitratos"], base: "RD 474/2014; Anexo VII Reg. 1169/2011" },
  charcuteria_loncheada: { parametros: ["Proteína", "Grasa", "Humedad", "Sal", "Nitritos / nitratos"], base: "RD 474/2014" },
  pesca: { parametros: ["Sal", "Humedad", "Histamina (ver microbiológico)", "Glaseado (%) si congelado"], base: "Reg. 1379/2013" },
  panaderia: { parametros: ["Sal (máx. 1,31 g/100 g en pan común)", "Humedad", "Fibra (pan integral)"], base: "RD 308/2019" },
  cafe_te_infusiones: { parametros: ["Cafeína", "Humedad", "Extracto seco soluble"], base: "RD 1231/1988" },
  confiteria: { parametros: ["Cacao (% mínimo)", "Manteca de cacao", "Humedad", "Azúcares"], base: "RD 1055/2003" },
  aguas_minerales: { parametros: ["Composición analítica completa", "Residuo seco", "pH", "Conductividad", "Aniones y cationes"], base: "RD 1798/2010" },
  complementos_alimenticios: { parametros: ["Contenido de cada nutriente o sustancia declarada", "Dosis diaria", "% VRN"], base: "RD 1487/2009" },
  infantiles_no_lactantes: { parametros: ["Composición nutricional completa", "Vitaminas y minerales", "Sodio"], base: "Directiva 2006/125/CE" },
  grupos_especificos: { parametros: ["Composición nutricional completa", "Vitaminas y minerales", "Proteína"], base: "Reg. (UE) 609/2013" },
};

/** Contaminantes según materia prima y proceso (Reg. (UE) 2023/915 y Reg. (UE) 2017/2158). */
const CONTAMINANTES: Record<string, string[]> = {
  pesca: ["Mercurio", "Cadmio", "Plomo", "Dioxinas y PCB (pescado graso)", "HAP (ahumados)"],
  productos_mar_especiales: ["Mercurio", "Cadmio", "Plomo", "Arsénico inorgánico (algas)", "Yodo (algas)"],
  carnico: ["Plomo", "Cadmio (despojos)", "Dioxinas y PCB", "HAP (ahumados / curados)"],
  charcuteria_loncheada: ["Plomo", "HAP (ahumados)", "Nitritos / nitratos"],
  caza: ["Plomo (perdigones)", "Cadmio", "Dioxinas"],
  lacteo: ["Aflatoxina M1", "Plomo", "Dioxinas y PCB"],
  lacteos_derivados: ["Aflatoxina M1", "Plomo"],
  cereales_pasta: ["Micotoxinas (DON, ZEA, OTA, fumonisinas, aflatoxinas)", "Cadmio", "Plomo", "Acrilamida (productos horneados)", "Alcaloides del cornezuelo"],
  panaderia: ["Acrilamida", "Micotoxinas (DON, OTA)", "Cadmio"],
  panaderia_congelada: ["Acrilamida", "Micotoxinas (DON, OTA)"],
  snacks: ["Acrilamida", "Micotoxinas (maíz)", "Aceites minerales (MOSH/MOAH)"],
  cafe_te_infusiones: ["Ocratoxina A", "Acrilamida (café)", "Alcaloides pirrolizidínicos (infusiones)", "Plomo"],
  frutas_hortalizas: ["Nitratos (hortalizas de hoja)", "Patulina (derivados de manzana)", "Plomo", "Cadmio"],
  bebidas_no_alcoholicas: ["Patulina (zumo de manzana)", "Plomo", "Arsénico (agua)"],
  aceites_grasas: ["3-MCPD y ésteres glicidílicos", "HAP (benzo(a)pireno)", "Aceites minerales (MOSH/MOAH)", "Plaguicidas ver aparte"],
  olivar: ["HAP", "3-MCPD", "Aceites minerales (MOSH/MOAH)"],
  confiteria: ["Cadmio (cacao)", "Aflatoxinas (frutos secos)", "Aceites minerales"],
  azucar_miel_edulcorantes: ["Plomo", "HMF (ver físico-químico)"],
  apicultura: ["Plomo", "Alcaloides pirrolizidínicos", "Residuos de antibióticos"],
  especias_salsas: ["Aflatoxinas", "Ocratoxina A", "Plomo", "Cadmio", "HAP (pimentón ahumado)"],
  infantiles_no_lactantes: ["Aflatoxinas", "Ocratoxina A", "Nitratos", "Plomo", "Cadmio", "Arsénico inorgánico", "Acrilamida"],
  grupos_especificos: ["Aflatoxinas", "Plomo", "Cadmio", "Arsénico inorgánico"],
  complementos_alimenticios: ["Plomo", "Cadmio", "Mercurio", "Alcaloides pirrolizidínicos (botánicos)", "HAP"],
  bebidas_vegetales: ["Arsénico inorgánico (arroz)", "Cadmio", "Aflatoxinas (frutos secos)"],
  vegetariano_plant_based: ["Cadmio (soja)", "Aflatoxinas", "Aceites minerales"],
  aguas_minerales: ["Arsénico", "Plomo", "Nitratos", "Nitritos", "Bromatos"],
  bebidas_alcoholicas: ["Ocratoxina A (vino)", "Plomo", "Carbamato de etilo (espirituosos)"],
  enologicos_vinagres: ["Ocratoxina A", "Plomo"],
  heladeria: ["Aflatoxina M1", "Plomo"],
  cbd_novel_recientes: ["THC", "Metales pesados", "HAP", "Disolventes residuales"],
};

/** Sectores de origen vegetal en los que procede el control de residuos de plaguicidas (Reg. (CE) 396/2005). */
const PLAGUICIDAS = new Set([
  "frutas_hortalizas", "cereales_pasta", "panaderia", "panaderia_congelada", "cafe_te_infusiones", "especias_salsas",
  "aceites_grasas", "olivar", "enologicos_vinagres", "bebidas_alcoholicas", "bebidas_no_alcoholicas", "apicultura",
  "azucar_miel_edulcorantes", "vegetales_fermentados", "bebidas_vegetales", "vegetariano_plant_based",
  "infantiles_no_lactantes", "grupos_especificos", "ecologico_calidad", "snacks", "confiteria", "reposteria_ingredientes",
  "complementos_alimenticios", "cbd_novel_recientes",
]);

/** Sectores con alto riesgo de contaminación cruzada por alérgenos. */
const ALERGENOS_RIESGO = new Set([
  "panaderia", "panaderia_congelada", "confiteria", "snacks", "cereales_pasta", "reposteria_ingredientes",
  "heladeria", "platos_preparados", "kits_preparados", "navidenos_estacionales",
]);

/** Sectores donde procede verificar ausencia/presencia de OMG (soja, maíz, colza). */
const OGM_RIESGO = new Set([
  "vegetariano_plant_based", "bebidas_vegetales", "cereales_pasta", "snacks", "aceites_grasas", "panaderia",
  "reposteria_ingredientes", "complementos_alimenticios",
]);

const AUTENTICIDAD: Record<string, string[]> = {
  pesca: ["Identificación de especie por ADN", "Origen (captura / acuicultura)"],
  productos_mar_especiales: ["Identificación de especie por ADN"],
  carnico: ["Identificación de especie", "Raza y alimentación (ibérico, RD 4/2014)"],
  charcuteria_loncheada: ["Identificación de especie", "Designación ibérico"],
  apicultura: ["Origen botánico (análisis polínico)", "Origen geográfico", "Adulteración con jarabes (isótopos)"],
  aceites_grasas: ["Autenticidad virgen extra (esteroles, ceras, ésteres etílicos)", "Mezclas con otros aceites"],
  olivar: ["Autenticidad virgen extra (esteroles, ceras)", "Variedad"],
  lacteo: ["Especie de la leche (vaca / oveja / cabra)"],
  lacteos_derivados: ["Especie de la leche (vaca / oveja / cabra)"],
  bebidas_alcoholicas: ["Origen (isótopos)", "Adulteración / aguado"],
  enologicos_vinagres: ["Origen de la materia prima (vino / alcohol)"],
  especias_salsas: ["Adulteración (azafrán, pimentón, orégano)"],
  cafe_te_infusiones: ["Mezcla de especies (arábica / robusta)"],
  azucar_miel_edulcorantes: ["Adulteración de miel con jarabes"],
};

const SENSORIAL_OBLIGATORIO = new Set(["aceites_grasas", "olivar"]);
const SENSORIAL_RECOMENDADO = new Set(["bebidas_alcoholicas", "enologicos_vinagres", "apicultura", "cafe_te_infusiones", "carnico", "lacteos_derivados"]);

/* ------------------------------------------------------------------ */
/* Catálogo                                                             */
/* ------------------------------------------------------------------ */

const si = (obligatoria: boolean, motivo: string, parametros: string[], nota?: string): Evaluacion => ({
  aplica: true,
  obligatoria,
  motivo,
  parametros,
  nota,
});
const no = (motivo: string): Evaluacion => ({ aplica: false, obligatoria: false, motivo, parametros: [] });

export const TIPOS_ANALISIS: TipoAnalisis[] = [
  {
    id: "lab_nutricional",
    titulo: "Análisis nutricional",
    descripcion:
      "Valor energético y nutrientes por 100 g o 100 ml, en el orden y formato que fija el Reglamento. Puede obtenerse por análisis o por cálculo a partir de los ingredientes (art. 31.4).",
    comoSeCubre: "Adjunta el informe del laboratorio o la receta con cantidades para calcularlo. Ordenamos los nutrientes según el Reg. 1169/2011.",
    baseLegal: "Reg. (UE) 1169/2011, art. 9.1.l y 30–35, Anexos V y XV",
    evaluar: ({ sectorId, atributos }) => {
      if (atributos.contieneAlcohol) return no("Exento: bebidas con más de 1,2 % vol. (art. 16.4)");
      if (atributos.ingredienteUnicoSinTransformar) return no("Exento: producto sin transformar de un solo ingrediente (Anexo V)");
      if (EXENTOS_NUTRICIONAL.has(sectorId)) return no(`Exento por Anexo V para ${nombreSector(sectorId)}`);
      return si(
        true,
        "Obligatorio para todos los alimentos envasados",
        ["Valor energético (kJ / kcal)", "Grasas", "de las cuales saturadas", "Hidratos de carbono", "de los cuales azúcares", "Proteínas", "Sal", "Fibra (opcional)"],
        "Puede calcularse a partir de la receta si no hay analítica.",
      );
    },
  },
  {
    id: "lab_vida_util",
    titulo: "Estudio de vida útil",
    descripcion: "Estudio que justifica la fecha de duración mínima («consumir preferentemente») o la fecha de caducidad en productos muy perecederos.",
    comoSeCubre: "Adjunta el estudio de vida útil o de estabilidad del laboratorio.",
    baseLegal: "Reg. (UE) 1169/2011, art. 24 y Anexo X",
    evaluar: ({ sectorId, atributos }) => {
      if (atributos.contieneAlcohol && sectorId === "bebidas_alcoholicas")
        return si(false, "Solo si tiene 10 % vol. o menos (cerveza, sidra): por encima está exento de fecha (Anexo X)", ["Estabilidad físico-química", "Evolución sensorial", "Turbidez / sedimentos"]);
      if (EXENTOS_FECHA.has(sectorId)) return no(`Exento de fecha de duración (Anexo X) para ${nombreSector(sectorId)}`);
      if (atributos.ingredienteUnicoSinTransformar && sectorId === "frutas_hortalizas") return no("Exento: fruta y hortaliza fresca sin transformar (Anexo X)");
      const perecedero = atributos.conservacion === "refrigerado";
      return si(
        true,
        perecedero ? "Refrigerado: justifica la fecha de caducidad" : "Justifica la fecha de consumo preferente",
        perecedero
          ? ["Evolución microbiológica hasta la caducidad", "Listeria monocytogenes (challenge test si listo para consumo)", "pH y Aw", "Condiciones de conservación y tras apertura"]
          : ["Estabilidad físico-química", "Evolución sensorial", "pH y Aw", "Condiciones de conservación y tras apertura"],
      );
    },
  },
  {
    id: "lab_microbiologico",
    titulo: "Análisis microbiológico",
    descripcion: "Comprobación de criterios de seguridad e higiene: patógenos e indicadores. Los parámetros dependen del tipo de producto y de si se consume sin cocinar.",
    comoSeCubre: "Adjunta el informe del laboratorio. Contrastamos los parámetros con el Reg. 2073/2005.",
    baseLegal: "Reg. (CE) 2073/2005",
    evaluar: ({ sectorId, atributos }) => {
      const params = MICRO_PARAMETROS[sectorId] ?? MICRO_DEFECTO;
      if (MICRO_SIEMPRE.has(sectorId)) return si(true, `Imprescindible en ${nombreSector(sectorId)}`, params);
      if (atributos.conservacion === "refrigerado") return si(true, "Producto refrigerado: criterios de seguridad aplicables", params);
      if (atributos.conservacion === "congelado") return si(true, "Producto congelado: criterios de higiene del proceso", params);
      if (atributos.listoParaConsumo) return si(false, "Listo para consumo a temperatura ambiente: recomendado para verificar Listeria y estabilidad", params);
      return si(false, "Recomendado como control de higiene del proceso", params);
    },
  },
  {
    id: "lab_fisicoquimico",
    titulo: "Análisis físico-químico",
    descripcion: "Parámetros de composición y calidad que exige la norma del producto (acidez, humedad, °Brix, materia grasa…) o que sustentan la vida útil (pH, Aw).",
    comoSeCubre: "Adjunta el informe del laboratorio. Comprobamos que los valores cumplen la norma de calidad del sector.",
    baseLegal: "Norma de calidad del sector",
    evaluar: ({ sectorId }) => {
      const norma = FQ_NORMA[sectorId];
      if (norma) return { ...si(true, `Norma de calidad de ${nombreSector(sectorId)} (${norma.base})`, norma.parametros), nota: norma.base };
      return si(false, "Sin norma de calidad específica: recomendado como soporte de la vida útil", ["pH", "Actividad de agua (Aw)", "Humedad", "Sal"]);
    },
  },
  {
    id: "lab_alcohol",
    titulo: "Determinación del grado alcohólico",
    descripcion: "Determinación del grado alcohólico volumétrico adquirido, con las tolerancias del Anexo XII.",
    comoSeCubre: "Adjunta el boletín de análisis con el grado alcohólico.",
    baseLegal: "Reg. (UE) 1169/2011, art. 28 y Anexo XII",
    evaluar: ({ atributos }) =>
      atributos.contieneAlcohol
        ? si(true, "Contiene más de 1,2 % vol.: el grado debe figurar en la etiqueta", ["Grado alcohólico volumétrico (% vol.)", "Tolerancia según Anexo XII"])
        : no("No contiene más de 1,2 % vol. de alcohol"),
  },
  {
    id: "lab_contaminantes",
    titulo: "Contaminantes",
    descripcion: "Metales pesados, micotoxinas, nitratos, HAP, acrilamida… según materia prima y proceso. No figuran en la etiqueta, pero condicionan que el producto pueda comercializarse.",
    comoSeCubre: "Adjunta el informe del laboratorio. Contrastamos con los límites máximos del Reg. 2023/915.",
    baseLegal: "Reg. (UE) 2023/915; Reg. (UE) 2017/2158 (acrilamida)",
    evaluar: ({ sectorId }) => {
      const params = CONTAMINANTES[sectorId];
      if (params) return si(true, `Límites máximos aplicables a ${nombreSector(sectorId)}`, params);
      return si(false, "Sin límites específicos para el sector: recomendado según materia prima", ["Plomo", "Cadmio", "Según proceso: acrilamida, HAP"]);
    },
  },
  {
    id: "lab_plaguicidas",
    titulo: "Residuos de plaguicidas",
    descripcion: "Control de límites máximos de residuos (LMR) en materias primas de origen vegetal.",
    comoSeCubre: "Adjunta el informe multirresiduos del laboratorio.",
    baseLegal: "Reg. (CE) 396/2005",
    evaluar: ({ sectorId, certIds }) => {
      if (PLAGUICIDAS.has(sectorId)) {
        const eco = certIds.includes("eco");
        return si(
          true,
          eco ? "Materia prima vegetal con certificación ecológica: verifica la ausencia de residuos" : "Materia prima de origen vegetal sujeta a LMR",
          ["Multirresiduos (LC-MS/MS y GC-MS/MS)", eco ? "Ausencia de fitosanitarios no autorizados en eco" : "Comparación con LMR por producto", "Glifosato (si procede)"],
        );
      }
      return no("Producto sin materia prima vegetal directa sujeta a LMR");
    },
  },
  {
    id: "lab_alergenos",
    titulo: "Alérgenos analíticos",
    descripcion: "Cuantificación de alérgenos para respaldar menciones «sin gluten» o «sin lactosa» o para validar la gestión de trazas.",
    comoSeCubre: "Adjunta el informe (ELISA o PCR) con el alérgeno cuantificado.",
    baseLegal: "Reg. (UE) 828/2014 (gluten); criterio nacional (lactosa); Reg. 1169/2011 Anexo II",
    evaluar: ({ sectorId, certIds }) => {
      const params: string[] = [];
      if (certIds.includes("sin_gluten")) params.push("Gluten < 20 mg/kg (ELISA R5)");
      if (certIds.includes("sin_lactosa")) params.push("Lactosa < 0,01 g/100 g (HPLC)");
      if (params.length) return si(true, "Respalda la mención «sin gluten» / «sin lactosa»", params);
      if (ALERGENOS_RIESGO.has(sectorId)) return si(false, "Sector con riesgo de contaminación cruzada: recomendado para validar las trazas declaradas", ["Alérgenos presentes en la línea (gluten, frutos de cáscara, leche, huevo, soja…)"]);
      return no("Sin mención «sin gluten» / «sin lactosa» ni riesgo especial de contaminación cruzada");
    },
  },
  {
    id: "lab_claims",
    titulo: "Soporte analítico de las declaraciones",
    descripcion: "Cada declaración nutricional o de salud debe respaldarse con valores que cumplan las condiciones del Reglamento («fuente de fibra» ≥ 3 g/100 g, «bajo en sal» ≤ 0,12 g/100 g…).",
    comoSeCubre: "Adjunta el informe del laboratorio con el nutriente o sustancia objeto de la declaración.",
    baseLegal: "Reg. (CE) 1924/2006; Reg. (UE) 432/2012",
    evaluar: ({ atributos, certIds }) =>
      atributos.llevaClaims || certIds.includes("claims_salud")
        ? si(true, "El producto lleva declaraciones nutricionales o de salud", ["Nutriente o sustancia declarada, por 100 g y por porción", "Comparación con la condición de uso del Anexo del Reg. 1924/2006"])
        : no("El producto no lleva declaraciones nutricionales ni de salud"),
  },
  {
    id: "lab_ogm",
    titulo: "Detección de OMG",
    descripcion: "Detección y cuantificación de organismos modificados genéticamente (soja, maíz, colza). Obligatorio etiquetar por encima del 0,9 %.",
    comoSeCubre: "Adjunta el informe PCR del laboratorio.",
    baseLegal: "Reg. (CE) 1829/2003; Reg. (CE) 1830/2003",
    evaluar: ({ sectorId, certIds }) => {
      if (certIds.includes("omg")) return si(true, "El producto contiene OMG: hay que cuantificarlos", ["PCR cuantitativa por evento", "% de OMG por ingrediente"]);
      if (certIds.includes("eco") && OGM_RIESGO.has(sectorId)) return si(true, "Ecológico con ingredientes de riesgo (soja, maíz, colza): debe verificarse la ausencia", ["PCR cualitativa (35S / NOS)", "Cuantificación si positivo"]);
      if (OGM_RIESGO.has(sectorId)) return si(false, "Ingredientes de riesgo (soja, maíz, colza): recomendado verificar el umbral del 0,9 %", ["PCR cualitativa (35S / NOS)", "Cuantificación si positivo"]);
      return no("Sin ingredientes de riesgo OMG");
    },
  },
  {
    id: "lab_autenticidad",
    titulo: "Autenticidad y especie",
    descripcion: "Verifica que el producto es lo que dice ser: especie, origen, variedad o ausencia de adulteración. Protege la denominación y evita información engañosa (art. 7).",
    comoSeCubre: "Adjunta el informe de identificación (ADN, isótopos, perfil químico…).",
    baseLegal: "Reg. (UE) 1169/2011, art. 7; normas verticales del sector",
    evaluar: ({ sectorId, certIds }) => {
      const params = AUTENTICIDAD[sectorId];
      if (!params) return no("Sin riesgo relevante de sustitución o adulteración en este sector");
      const dop = certIds.includes("dop_igp");
      return si(dop, dop ? "Producto amparado por DOP / IGP: debe acreditarse el origen" : `Riesgo de sustitución o adulteración en ${nombreSector(sectorId)}`, params);
    },
  },
  {
    id: "lab_sensorial",
    titulo: "Análisis sensorial (panel de cata)",
    descripcion: "Valoración organoléptica por panel acreditado. En aceite de oliva decide la categoría comercial junto con los parámetros químicos.",
    comoSeCubre: "Adjunta el informe del panel de cata.",
    baseLegal: "Reg. (CEE) 2568/91 (aceite); pliegos DOP / IGP",
    evaluar: ({ sectorId, certIds }) => {
      if (SENSORIAL_OBLIGATORIO.has(sectorId)) return si(true, "Necesario para clasificar el aceite (virgen extra / virgen / lampante)", ["Mediana del defecto", "Mediana del frutado", "Panel acreditado (COI)"]);
      if (certIds.includes("dop_igp") && SENSORIAL_RECOMENDADO.has(sectorId)) return si(true, "Pliego de condiciones de la DOP / IGP", ["Perfil sensorial según pliego"]);
      if (SENSORIAL_RECOMENDADO.has(sectorId)) return si(false, "Recomendado para respaldar la calidad declarada", ["Perfil sensorial descriptivo"]);
      return no("Sin exigencia sensorial para este producto");
    },
  },
];

export type AnalisisEvaluado = TipoAnalisis & Evaluacion;

/** Evalúa todo el catálogo para un producto. */
export function evaluarAnalisis(ctx: Contexto): AnalisisEvaluado[] {
  return TIPOS_ANALISIS.map((t) => ({ ...t, ...t.evaluar(ctx) }));
}
