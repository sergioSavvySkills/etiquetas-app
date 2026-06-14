/**
 * Modelo de datos de la ficha técnica de un producto alimenticio.
 *
 * Esta app recopila la información (ver inputs del brief) y genera la ficha
 * técnica que el fabricante usará para elaborar la etiqueta. La app NO produce
 * la etiqueta final.
 */

export type Ingrediente = {
  id: string;
  nombre: string;
  /** Porcentaje sobre el total del producto. */
  porcentaje: string;
  /** Origen / procedencia opcional. */
  origen: string;
};

export type InfoNutricional = {
  /** Energía en kcal por 100 g/ml. */
  energiaKcal: string;
  /** Energía en kJ por 100 g/ml. */
  energiaKj: string;
  grasas: string;
  grasasSaturadas: string;
  hidratos: string;
  azucares: string;
  fibra: string;
  proteinas: string;
  sal: string;
};

/** Los 14 alérgenos de declaración obligatoria en la UE (Reg. 1169/2011). */
export const ALERGENOS_UE = [
  "Gluten (cereales)",
  "Crustáceos",
  "Huevos",
  "Pescado",
  "Cacahuetes",
  "Soja",
  "Leche y lácteos",
  "Frutos de cáscara",
  "Apio",
  "Mostaza",
  "Granos de sésamo",
  "Dióxido de azufre y sulfitos",
  "Altramuces",
  "Moluscos",
] as const;

export type Alergeno = (typeof ALERGENOS_UE)[number];

export type ArchivoAdjunto = {
  nombre: string;
  /** Tamaño en bytes. */
  tamano: number;
  tipo: string;
};

export type FichaTecnica = {
  // Identificación
  nombreProducto: string;
  ean: string;
  fotoProducto: ArchivoAdjunto | null;

  // Composición
  ingredientes: Ingrediente[];
  /** Alérgenos presentes ("contiene"). */
  alergenosContiene: Alergeno[];
  /** Alérgenos por trazas ("puede contener"). */
  alergenosTrazas: Alergeno[];

  // Análisis
  infoNutricional: InfoNutricional;
  vidaUtil: string;
  analisisMicrobiologico: string;
  analisisLaboratorio: string;
  pasteurizado: boolean;

  // Conservación y uso
  tipoEnvase: string;
  condicionesConservacion: string;
  temperaturaConservacion: string;
  modoEmpleo: string;

  // Legal
  registroSanitario: string;
  fabricante: string;
  direccionFabricante: string;
  fichaTecnicaProveedor: ArchivoAdjunto | null;
};

export function crearFichaVacia(): FichaTecnica {
  return {
    nombreProducto: "",
    ean: "",
    fotoProducto: null,
    ingredientes: [{ id: crypto.randomUUID(), nombre: "", porcentaje: "", origen: "" }],
    alergenosContiene: [],
    alergenosTrazas: [],
    infoNutricional: {
      energiaKcal: "",
      energiaKj: "",
      grasas: "",
      grasasSaturadas: "",
      hidratos: "",
      azucares: "",
      fibra: "",
      proteinas: "",
      sal: "",
    },
    vidaUtil: "",
    analisisMicrobiologico: "",
    analisisLaboratorio: "",
    pasteurizado: false,
    tipoEnvase: "",
    condicionesConservacion: "",
    temperaturaConservacion: "",
    modoEmpleo: "",
    registroSanitario: "",
    fabricante: "",
    direccionFabricante: "",
    fichaTecnicaProveedor: null,
  };
}

/** Datos de ejemplo para precargar el demo. */
export function crearFichaDemo(): FichaTecnica {
  return {
    nombreProducto: "Mermelada artesanal de fresa",
    ean: "8412345678905",
    fotoProducto: null,
    ingredientes: [
      { id: crypto.randomUUID(), nombre: "Fresa", porcentaje: "55", origen: "España" },
      { id: crypto.randomUUID(), nombre: "Azúcar", porcentaje: "43", origen: "" },
      { id: crypto.randomUUID(), nombre: "Pectina", porcentaje: "1.5", origen: "" },
      { id: crypto.randomUUID(), nombre: "Ácido cítrico", porcentaje: "0.5", origen: "" },
    ],
    alergenosContiene: [],
    alergenosTrazas: ["Frutos de cáscara"],
    infoNutricional: {
      energiaKcal: "215",
      energiaKj: "912",
      grasas: "0.2",
      grasasSaturadas: "0.1",
      hidratos: "52",
      azucares: "50",
      fibra: "1.1",
      proteinas: "0.4",
      sal: "0.02",
    },
    vidaUtil: "24 meses desde la fecha de fabricación",
    analisisMicrobiologico: "Ausencia de patógenos. Mohos y levaduras < 10 ufc/g.",
    analisisLaboratorio: "pH 3.2 · Brix 65° · Aw 0.82",
    pasteurizado: true,
    tipoEnvase: "Tarro de vidrio con tapa metálica twist-off",
    condicionesConservacion: "Conservar en lugar fresco y seco. Una vez abierto, refrigerar.",
    temperaturaConservacion: "Ambiente (cerrado) / 0–5 °C (abierto)",
    modoEmpleo: "Listo para consumir. Untar directamente.",
    registroSanitario: "RGSEAA 21.00000/CA",
    fabricante: "Conservas del Sur, S.L.",
    direccionFabricante: "Pol. Ind. La Vega, 11, 41560 Estepa, Sevilla, España",
    fichaTecnicaProveedor: null,
  };
}
