"use client";

import {
  ALERGENOS_UE,
  type Alergeno,
  type ArchivoAdjunto,
  type FichaTecnica,
  type Ingrediente,
} from "@/lib/ficha";
import { Field, Input, Section, TextArea } from "@/components/ui";

type Props = {
  ficha: FichaTecnica;
  setFicha: React.Dispatch<React.SetStateAction<FichaTecnica>>;
};

function archivoDesdeInput(file: File | null | undefined): ArchivoAdjunto | null {
  if (!file) return null;
  return { nombre: file.name, tamano: file.size, tipo: file.type };
}

export default function FichaForm({ ficha, setFicha }: Props) {
  const set = <K extends keyof FichaTecnica>(key: K, value: FichaTecnica[K]) =>
    setFicha((f) => ({ ...f, [key]: value }));

  const setIngrediente = (id: string, patch: Partial<Ingrediente>) =>
    setFicha((f) => ({
      ...f,
      ingredientes: f.ingredientes.map((ing) =>
        ing.id === id ? { ...ing, ...patch } : ing,
      ),
    }));

  const addIngrediente = () =>
    setFicha((f) => ({
      ...f,
      ingredientes: [
        ...f.ingredientes,
        { id: crypto.randomUUID(), nombre: "", porcentaje: "", origen: "" },
      ],
    }));

  const removeIngrediente = (id: string) =>
    setFicha((f) => ({
      ...f,
      ingredientes: f.ingredientes.filter((ing) => ing.id !== id),
    }));

  const toggleAlergeno = (
    campo: "alergenosContiene" | "alergenosTrazas",
    alergeno: Alergeno,
  ) =>
    setFicha((f) => {
      const actuales = f[campo];
      const next = actuales.includes(alergeno)
        ? actuales.filter((a) => a !== alergeno)
        : [...actuales, alergeno];
      return { ...f, [campo]: next };
    });

  const setNutricional = (key: keyof FichaTecnica["infoNutricional"], value: string) =>
    setFicha((f) => ({
      ...f,
      infoNutricional: { ...f.infoNutricional, [key]: value },
    }));

  return (
    <div className="space-y-5">
      <Section title="Identificación del producto">
        <Field label="Nombre del producto">
          <Input
            value={ficha.nombreProducto}
            onChange={(e) => set("nombreProducto", e.target.value)}
            placeholder="Ej. Mermelada artesanal de fresa"
          />
        </Field>
        <Field label="Código EAN" hint="Código de barras del producto (8 o 13 dígitos).">
          <Input
            value={ficha.ean}
            onChange={(e) => set("ean", e.target.value)}
            placeholder="8412345678905"
            inputMode="numeric"
          />
        </Field>
        <Field label="Foto del producto">
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => set("fotoProducto", archivoDesdeInput(e.target.files?.[0]))}
          />
        </Field>
      </Section>

      <Section
        title="Composición"
        description="Ingredientes en orden decreciente de peso, con su porcentaje."
      >
        <div className="space-y-3">
          {ficha.ingredientes.map((ing, i) => (
            <div
              key={ing.id}
              className="grid grid-cols-[1fr_5rem_1fr_auto] items-end gap-2"
            >
              <Field label={i === 0 ? "Ingrediente" : ""}>
                <Input
                  value={ing.nombre}
                  onChange={(e) => setIngrediente(ing.id, { nombre: e.target.value })}
                  placeholder="Fresa"
                />
              </Field>
              <Field label={i === 0 ? "%" : ""}>
                <Input
                  value={ing.porcentaje}
                  onChange={(e) => setIngrediente(ing.id, { porcentaje: e.target.value })}
                  placeholder="55"
                  inputMode="decimal"
                />
              </Field>
              <Field label={i === 0 ? "Origen" : ""}>
                <Input
                  value={ing.origen}
                  onChange={(e) => setIngrediente(ing.id, { origen: e.target.value })}
                  placeholder="España"
                />
              </Field>
              <button
                type="button"
                onClick={() => removeIngrediente(ing.id)}
                disabled={ficha.ingredientes.length === 1}
                className="mb-1 h-9 w-9 rounded-lg border border-zinc-300 text-zinc-500 transition hover:border-red-400 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700"
                aria-label="Eliminar ingrediente"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addIngrediente}
          className="text-xs font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
        >
          + Añadir ingrediente
        </button>
      </Section>

      <Section
        title="Alérgenos"
        description="Declaración según Reglamento (UE) 1169/2011."
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          {ALERGENOS_UE.map((alergeno) => (
            <div
              key={alergeno}
              className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 dark:border-zinc-800"
            >
              <span className="text-xs text-zinc-700 dark:text-zinc-300">{alergeno}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => toggleAlergeno("alergenosContiene", alergeno)}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition ${
                    ficha.alergenosContiene.includes(alergeno)
                      ? "bg-red-600 text-white"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                  }`}
                >
                  Contiene
                </button>
                <button
                  type="button"
                  onClick={() => toggleAlergeno("alergenosTrazas", alergeno)}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition ${
                    ficha.alergenosTrazas.includes(alergeno)
                      ? "bg-amber-500 text-white"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                  }`}
                >
                  Trazas
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Información nutricional"
        description="Valores por 100 g / 100 ml."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Energía (kcal)">
            <Input
              value={ficha.infoNutricional.energiaKcal}
              onChange={(e) => setNutricional("energiaKcal", e.target.value)}
              inputMode="decimal"
            />
          </Field>
          <Field label="Energía (kJ)">
            <Input
              value={ficha.infoNutricional.energiaKj}
              onChange={(e) => setNutricional("energiaKj", e.target.value)}
              inputMode="decimal"
            />
          </Field>
          <Field label="Grasas (g)">
            <Input
              value={ficha.infoNutricional.grasas}
              onChange={(e) => setNutricional("grasas", e.target.value)}
              inputMode="decimal"
            />
          </Field>
          <Field label="— de saturadas (g)">
            <Input
              value={ficha.infoNutricional.grasasSaturadas}
              onChange={(e) => setNutricional("grasasSaturadas", e.target.value)}
              inputMode="decimal"
            />
          </Field>
          <Field label="Hidratos (g)">
            <Input
              value={ficha.infoNutricional.hidratos}
              onChange={(e) => setNutricional("hidratos", e.target.value)}
              inputMode="decimal"
            />
          </Field>
          <Field label="— de azúcares (g)">
            <Input
              value={ficha.infoNutricional.azucares}
              onChange={(e) => setNutricional("azucares", e.target.value)}
              inputMode="decimal"
            />
          </Field>
          <Field label="Fibra (g)">
            <Input
              value={ficha.infoNutricional.fibra}
              onChange={(e) => setNutricional("fibra", e.target.value)}
              inputMode="decimal"
            />
          </Field>
          <Field label="Proteínas (g)">
            <Input
              value={ficha.infoNutricional.proteinas}
              onChange={(e) => setNutricional("proteinas", e.target.value)}
              inputMode="decimal"
            />
          </Field>
          <Field label="Sal (g)">
            <Input
              value={ficha.infoNutricional.sal}
              onChange={(e) => setNutricional("sal", e.target.value)}
              inputMode="decimal"
            />
          </Field>
        </div>
      </Section>

      <Section title="Análisis y calidad">
        <Field label="Análisis de vida útil">
          <Input
            value={ficha.vidaUtil}
            onChange={(e) => set("vidaUtil", e.target.value)}
            placeholder="Ej. 24 meses desde la fabricación"
          />
        </Field>
        <Field label="Análisis microbiológico">
          <TextArea
            value={ficha.analisisMicrobiologico}
            onChange={(e) => set("analisisMicrobiologico", e.target.value)}
            placeholder="Ausencia de patógenos. Mohos y levaduras < 10 ufc/g."
          />
        </Field>
        <Field label="Análisis de laboratorio" hint="Parámetros fisicoquímicos.">
          <Input
            value={ficha.analisisLaboratorio}
            onChange={(e) => set("analisisLaboratorio", e.target.value)}
            placeholder="pH 3.2 · Brix 65° · Aw 0.82"
          />
        </Field>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={ficha.pasteurizado}
            onChange={(e) => set("pasteurizado", e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            Producto pasteurizado
          </span>
        </label>
      </Section>

      <Section title="Conservación y uso">
        <Field label="Tipo de envase">
          <Input
            value={ficha.tipoEnvase}
            onChange={(e) => set("tipoEnvase", e.target.value)}
            placeholder="Tarro de vidrio con tapa twist-off"
          />
        </Field>
        <Field label="Condiciones de conservación">
          <TextArea
            value={ficha.condicionesConservacion}
            onChange={(e) => set("condicionesConservacion", e.target.value)}
            placeholder="Conservar en lugar fresco y seco. Una vez abierto, refrigerar."
          />
        </Field>
        <Field label="Temperatura de conservación">
          <Input
            value={ficha.temperaturaConservacion}
            onChange={(e) => set("temperaturaConservacion", e.target.value)}
            placeholder="Ambiente / 0–5 °C una vez abierto"
          />
        </Field>
        <Field label="Modo de empleo">
          <TextArea
            value={ficha.modoEmpleo}
            onChange={(e) => set("modoEmpleo", e.target.value)}
            placeholder="Listo para consumir. Untar directamente."
          />
        </Field>
      </Section>

      <Section title="Información legal">
        <Field label="Registro sanitario">
          <Input
            value={ficha.registroSanitario}
            onChange={(e) => set("registroSanitario", e.target.value)}
            placeholder="RGSEAA 21.00000/CA"
          />
        </Field>
        <Field label="Fabricante / Responsable">
          <Input
            value={ficha.fabricante}
            onChange={(e) => set("fabricante", e.target.value)}
            placeholder="Conservas del Sur, S.L."
          />
        </Field>
        <Field label="Dirección del fabricante">
          <TextArea
            value={ficha.direccionFabricante}
            onChange={(e) => set("direccionFabricante", e.target.value)}
            placeholder="Pol. Ind. La Vega, 11, 41560 Estepa, Sevilla, España"
          />
        </Field>
        <Field
          label="Ficha técnica del proveedor"
          hint="PDF de referencia aportado por el proveedor."
        >
          <Input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) =>
              set("fichaTecnicaProveedor", archivoDesdeInput(e.target.files?.[0]))
            }
          />
        </Field>
      </Section>
    </div>
  );
}
