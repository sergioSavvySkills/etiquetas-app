"use client";

import { useState } from "react";
import {
  ALERGENOS_UE,
  crearFichaVacia,
  type Alergeno,
  type FichaTecnica,
  type Ingrediente,
} from "@/lib/ficha";
import {
  SECTORES,
  CERTIFICACIONES,
  getSector,
  getRequisitos,
  sugerirSector,
  mencionSatisfecha,
  esCampoComplejo,
  aplicarValorMencion,
  valorMencion,
  type Mencion,
} from "@/lib/matriz";
import type { DescribeResult } from "@/lib/ai";
import { Field, Input, TextArea } from "@/components/ui";
import FichaPreview from "@/components/FichaPreview";
import StepShell from "@/components/wizard/StepShell";
import DescribeStep from "@/components/wizard/DescribeStep";
import AiAssist from "@/components/wizard/AiAssist";

type StepId =
  | "describe"
  | "tipo"
  | "nombre"
  | "ean"
  | "ingredientes"
  | "alergenos"
  | "nutricional"
  | "calidad"
  | "conservacion"
  | "legal"
  | "verificacion"
  | "resumen";

const STEPS: { id: StepId; question: string; help?: string }[] = [
  { id: "describe", question: "Cuéntanos sobre tu producto", help: "Descríbelo con tus palabras. La IA extraerá los datos y tú solo confirmas." },
  { id: "tipo", question: "¿Qué tipo de producto es?", help: "Lo usamos para saber qué exige la normativa. Si no lo sabes, te lo proponemos nosotros." },
  { id: "nombre", question: "¿Cómo se llama el producto?", help: "El nombre comercial tal como aparecerá en la ficha." },
  { id: "ean", question: "¿Cuál es su código EAN?", help: "Código de barras de 8 o 13 dígitos. Puedes dejarlo vacío por ahora." },
  { id: "ingredientes", question: "¿Qué ingredientes lleva?", help: "En orden decreciente de peso, con su porcentaje." },
  { id: "alergenos", question: "¿Contiene alérgenos?", help: "Declaración según Reglamento (UE) 1169/2011." },
  { id: "nutricional", question: "Información nutricional", help: "Valores por 100 g / 100 ml." },
  { id: "calidad", question: "Análisis y calidad", help: "Vida útil y análisis del producto." },
  { id: "conservacion", question: "Conservación y uso", help: "Cómo se guarda y cómo se consume." },
  { id: "legal", question: "Información legal", help: "Responsable y registro sanitario." },
  { id: "verificacion", question: "Verificación de cumplimiento", help: "Comprobamos por ti que no falta ninguna mención obligatoria." },
  { id: "resumen", question: "Revisa tu ficha técnica", help: "Esto es lo que generamos con tus respuestas." },
];

function mergeDescribe(ficha: FichaTecnica, r: DescribeResult): FichaTecnica {
  const validos = new Set<string>(ALERGENOS_UE);
  const ingredientes: Ingrediente[] =
    r.ingredientes && r.ingredientes.length
      ? r.ingredientes.map((i) => ({
          id: crypto.randomUUID(),
          nombre: i.nombre ?? "",
          porcentaje: i.porcentaje ?? "",
          origen: i.origen ?? "",
        }))
      : ficha.ingredientes;

  return {
    ...ficha,
    nombreProducto: r.nombreProducto || ficha.nombreProducto,
    ingredientes,
    alergenosContiene: (r.alergenosContiene ?? []).filter((a) =>
      validos.has(a),
    ) as Alergeno[],
    alergenosTrazas: (r.alergenosTrazas ?? []).filter((a) =>
      validos.has(a),
    ) as Alergeno[],
    tipoEnvase: r.tipoEnvase || ficha.tipoEnvase,
    condicionesConservacion:
      r.condicionesConservacion || ficha.condicionesConservacion,
    modoEmpleo: r.modoEmpleo || ficha.modoEmpleo,
    vidaUtil: r.vidaUtil || ficha.vidaUtil,
  };
}

export default function Wizard() {
  const [step, setStep] = useState(0);
  const [ficha, setFicha] = useState<FichaTecnica>(crearFichaVacia);
  const [descripcion, setDescripcion] = useState("");
  const [finished, setFinished] = useState(false);

  const total = STEPS.length;
  const current = STEPS[step];

  const next = () => setStep((s) => Math.min(s + 1, total - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const set = <K extends keyof FichaTecnica>(key: K, value: FichaTecnica[K]) =>
    setFicha((f) => ({ ...f, [key]: value }));

  const setNutricional = (
    key: keyof FichaTecnica["infoNutricional"],
    value: string,
  ) =>
    setFicha((f) => ({
      ...f,
      infoNutricional: { ...f.infoNutricional, [key]: value },
    }));

  if (finished) {
    return <FinishScreen ficha={ficha} onRestart={() => {
      setFicha(crearFichaVacia());
      setDescripcion("");
      setStep(0);
      setFinished(false);
    }} />;
  }

  const requisitos = getRequisitos(ficha.sectorId, ficha.certificaciones);
  const faltantes = requisitos.filter(
    (m) => m.obligatoria && !mencionSatisfecha(m, ficha),
  );

  let puedeAvanzar = true;
  if (current.id === "nombre") puedeAvanzar = ficha.nombreProducto.trim().length > 0;
  else if (current.id === "tipo") puedeAvanzar = ficha.sectorId.length > 0;
  else if (current.id === "verificacion") puedeAvanzar = faltantes.length === 0;

  const goToStepId = (id: StepId) =>
    setStep(STEPS.findIndex((s) => s.id === id));

  return (
    <StepShell
      stepIndex={step}
      total={total}
      question={current.question}
      help={current.help}
      onBack={back}
      onNext={step === total - 1 ? () => setFinished(true) : next}
      hideNext={current.id === "describe"}
      nextLabel={step === total - 1 ? "Finalizar ✓" : "Continuar"}
      canAdvance={puedeAvanzar}
    >
      {current.id === "describe" && (
        <DescribeStep
          defaultText={descripcion}
          onSkip={next}
          onApply={(r, text) => {
            setDescripcion(text);
            setFicha((f) => mergeDescribe(f, r));
            next();
          }}
        />
      )}

      {current.id === "tipo" && (
        <TipoStep descripcion={descripcion} ficha={ficha} setFicha={setFicha} />
      )}

      {current.id === "nombre" && (
        <div>
          <Input
            autoFocus
            value={ficha.nombreProducto}
            onChange={(e) => set("nombreProducto", e.target.value)}
            placeholder="Ej. Mermelada artesanal de fresa"
            className="text-base"
          />
          <AiAssist
            field="Nombre del producto"
            value={ficha.nombreProducto}
            onApply={(v) => set("nombreProducto", v)}
          />
        </div>
      )}

      {current.id === "ean" && (
        <Input
          autoFocus
          value={ficha.ean}
          onChange={(e) => set("ean", e.target.value)}
          placeholder="8412345678905"
          inputMode="numeric"
          className="text-base"
        />
      )}

      {current.id === "ingredientes" && (
        <IngredientesEditor ficha={ficha} setFicha={setFicha} />
      )}

      {current.id === "alergenos" && (
        <AlergenosEditor ficha={ficha} setFicha={setFicha} />
      )}

      {current.id === "nutricional" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(
            [
              ["energiaKcal", "Energía (kcal)"],
              ["energiaKj", "Energía (kJ)"],
              ["grasas", "Grasas (g)"],
              ["grasasSaturadas", "— saturadas (g)"],
              ["hidratos", "Hidratos (g)"],
              ["azucares", "— azúcares (g)"],
              ["fibra", "Fibra (g)"],
              ["proteinas", "Proteínas (g)"],
              ["sal", "Sal (g)"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <Input
                value={ficha.infoNutricional[key]}
                onChange={(e) => setNutricional(key, e.target.value)}
                inputMode="decimal"
              />
            </Field>
          ))}
        </div>
      )}

      {current.id === "calidad" && (
        <div className="space-y-4">
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
          <Field label="Análisis de laboratorio">
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
        </div>
      )}

      {current.id === "conservacion" && (
        <div className="space-y-4">
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
            <AiAssist
              field="Condiciones de conservación"
              value={ficha.condicionesConservacion}
              context={ficha.nombreProducto}
              onApply={(v) => set("condicionesConservacion", v)}
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
            <AiAssist
              field="Modo de empleo"
              value={ficha.modoEmpleo}
              context={ficha.nombreProducto}
              onApply={(v) => set("modoEmpleo", v)}
            />
          </Field>
        </div>
      )}

      {current.id === "legal" && (
        <div className="space-y-4">
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
        </div>
      )}

      {current.id === "verificacion" && (
        <VerificacionStep
          ficha={ficha}
          setFicha={setFicha}
          onIrACampo={(campo) => {
            if (campo === "ingredientes") goToStepId("ingredientes");
            else if (campo === "alergenos") goToStepId("alergenos");
            else if (campo === "infoNutricional") goToStepId("nutricional");
          }}
        />
      )}

      {current.id === "resumen" && (
        <div className="max-h-[55vh] overflow-y-auto rounded-xl">
          <FichaPreview ficha={ficha} />
        </div>
      )}
    </StepShell>
  );
}

function IngredientesEditor({
  ficha,
  setFicha,
}: {
  ficha: FichaTecnica;
  setFicha: React.Dispatch<React.SetStateAction<FichaTecnica>>;
}) {
  const setIng = (id: string, patch: Partial<Ingrediente>) =>
    setFicha((f) => ({
      ...f,
      ingredientes: f.ingredientes.map((i) =>
        i.id === id ? { ...i, ...patch } : i,
      ),
    }));
  const add = () =>
    setFicha((f) => ({
      ...f,
      ingredientes: [
        ...f.ingredientes,
        { id: crypto.randomUUID(), nombre: "", porcentaje: "", origen: "" },
      ],
    }));
  const remove = (id: string) =>
    setFicha((f) => ({
      ...f,
      ingredientes: f.ingredientes.filter((i) => i.id !== id),
    }));

  return (
    <div className="space-y-3">
      {ficha.ingredientes.map((ing, i) => (
        <div key={ing.id} className="grid grid-cols-[1fr_4.5rem_auto] gap-2">
          <Input
            value={ing.nombre}
            onChange={(e) => setIng(ing.id, { nombre: e.target.value })}
            placeholder={i === 0 ? "Fresa" : "Ingrediente"}
            autoFocus={i === 0}
          />
          <Input
            value={ing.porcentaje}
            onChange={(e) => setIng(ing.id, { porcentaje: e.target.value })}
            placeholder="%"
            inputMode="decimal"
          />
          <button
            type="button"
            onClick={() => remove(ing.id)}
            disabled={ficha.ingredientes.length === 1}
            className="h-[42px] w-10 rounded-lg border border-zinc-300 text-zinc-500 transition hover:border-red-400 hover:text-red-500 disabled:opacity-40 dark:border-zinc-700"
            aria-label="Eliminar"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-sm font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
      >
        + Añadir ingrediente
      </button>
    </div>
  );
}

function AlergenosEditor({
  ficha,
  setFicha,
}: {
  ficha: FichaTecnica;
  setFicha: React.Dispatch<React.SetStateAction<FichaTecnica>>;
}) {
  const toggle = (
    campo: "alergenosContiene" | "alergenosTrazas",
    alergeno: Alergeno,
  ) =>
    setFicha((f) => {
      const actuales = f[campo];
      return {
        ...f,
        [campo]: actuales.includes(alergeno)
          ? actuales.filter((a) => a !== alergeno)
          : [...actuales, alergeno],
      };
    });

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {ALERGENOS_UE.map((alergeno) => (
        <div
          key={alergeno}
          className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 dark:border-zinc-800"
        >
          <span className="text-xs text-zinc-700 dark:text-zinc-300">
            {alergeno}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => toggle("alergenosContiene", alergeno)}
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
              onClick={() => toggle("alergenosTrazas", alergeno)}
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
  );
}

function FinishScreen({
  ficha,
  onRestart,
}: {
  ficha: FichaTecnica;
  onRestart: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col items-center justify-center px-5 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl dark:bg-green-900/40">
        ✓
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        ¡Ficha técnica lista!
      </h1>
      <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
        Generamos la ficha técnica de{" "}
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          {ficha.nombreProducto || "tu producto"}
        </span>
        . El fabricante puede usarla para elaborar la etiqueta.
      </p>
      <div className="mt-6 w-full text-left">
        <FichaPreview ficha={ficha} />
      </div>
      <button
        type="button"
        onClick={onRestart}
        className="mt-6 rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Crear otra ficha
      </button>
    </div>
  );
}

const selectClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

function TipoStep({
  descripcion,
  ficha,
  setFicha,
}: {
  descripcion: string;
  ficha: FichaTecnica;
  setFicha: React.Dispatch<React.SetStateAction<FichaTecnica>>;
}) {
  const sugerencia = ficha.sectorId ? undefined : sugerirSector(descripcion);
  const sector = getSector(ficha.sectorId);

  const toggleCert = (id: string) =>
    setFicha((f) => ({
      ...f,
      certificaciones: f.certificaciones.includes(id)
        ? f.certificaciones.filter((c) => c !== id)
        : [...f.certificaciones, id],
    }));

  return (
    <div className="space-y-5">
      {sugerencia ? (
        <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900 dark:bg-violet-950/30">
          <p className="text-sm text-violet-800 dark:text-violet-200">
            <span aria-hidden>✨ </span>
            Por tu descripción, creo que es <strong>{sugerencia.nombre}</strong>.
          </p>
          <button
            type="button"
            onClick={() => setFicha((f) => ({ ...f, sectorId: sugerencia.id }))}
            className="mt-3 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Sí, es eso →
          </button>
        </div>
      ) : null}

      <Field label="Tipo de producto">
        <select
          value={ficha.sectorId}
          onChange={(e) => setFicha((f) => ({ ...f, sectorId: e.target.value }))}
          className={selectClass}
        >
          <option value="">Selecciona…</option>
          {SECTORES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      </Field>

      {sector ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Normativa aplicable: {sector.normativaBase.join(" · ")}
        </p>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          ¿Certificaciones o características especiales?{" "}
          <span className="font-normal text-zinc-400">(opcional)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {CERTIFICACIONES.map((c) => {
            const activa = ficha.certificaciones.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCert(c.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  activa
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
                }`}
              >
                {c.nombre}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function VerificacionStep({
  ficha,
  setFicha,
  onIrACampo,
}: {
  ficha: FichaTecnica;
  setFicha: React.Dispatch<React.SetStateAction<FichaTecnica>>;
  onIrACampo: (campo: string) => void;
}) {
  const requisitos = getRequisitos(ficha.sectorId, ficha.certificaciones);
  const obligatorias = requisitos.filter((m) => m.obligatoria);
  const pendientes = obligatorias.filter((m) => !mencionSatisfecha(m, ficha));
  const completas = obligatorias.filter((m) => mencionSatisfecha(m, ficha));
  const recomendadas = requisitos.filter(
    (m) => !m.obligatoria && !mencionSatisfecha(m, ficha),
  );

  return (
    <div className="space-y-5">
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        {pendientes.length === 0 ? (
          <>✅ Tienes toda la información obligatoria. Ya puedes generar la ficha.</>
        ) : (
          <>
            Nos {pendientes.length === 1 ? "falta" : "faltan"}{" "}
            <strong>
              {pendientes.length} dato{pendientes.length === 1 ? "" : "s"}
            </strong>{" "}
            que la normativa exige para este producto. Lo completamos aquí:
          </>
        )}
      </p>

      <div className="space-y-3">
        {pendientes.map((m) => (
          <MencionPendiente
            key={m.id}
            mencion={m}
            ficha={ficha}
            setFicha={setFicha}
            onIrACampo={onIrACampo}
          />
        ))}
      </div>

      {recomendadas.length ? (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Recomendado (opcional)
          </p>
          {recomendadas.map((m) => (
            <MencionPendiente
              key={m.id}
              mencion={m}
              ficha={ficha}
              setFicha={setFicha}
              onIrACampo={onIrACampo}
              opcional
            />
          ))}
        </div>
      ) : null}

      {completas.length ? (
        <details className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
          <summary className="cursor-pointer text-sm font-medium text-zinc-600 dark:text-zinc-300">
            ✅ {completas.length} requisitos ya cubiertos
          </summary>
          <ul className="mt-2 space-y-1">
            {completas.map((m) => (
              <li key={m.id} className="text-xs text-zinc-500 dark:text-zinc-400">
                <span className="text-green-600">✓</span> {m.etiquetaCorta}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function MencionPendiente({
  mencion,
  ficha,
  setFicha,
  onIrACampo,
  opcional = false,
}: {
  mencion: Mencion;
  ficha: FichaTecnica;
  setFicha: React.Dispatch<React.SetStateAction<FichaTecnica>>;
  onIrACampo: (campo: string) => void;
  opcional?: boolean;
}) {
  const [verPorque, setVerPorque] = useState(false);
  const complejo = esCampoComplejo(mencion);
  const borde = opcional
    ? "border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/40"
    : "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20";

  return (
    <div className={`rounded-xl border p-4 ${borde}`}>
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {mencion.preguntaUsuario}
      </p>

      {complejo ? (
        <button
          type="button"
          onClick={() => mencion.campo && onIrACampo(mencion.campo)}
          className="mt-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Completar este apartado →
        </button>
      ) : mencion.tipo === "declaracion" ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFicha((f) => aplicarValorMencion(f, mencion, "Lo incluiré"))}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Lo incluiré
          </button>
          <button
            type="button"
            onClick={() => setFicha((f) => aplicarValorMencion(f, mencion, "No aplica"))}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            No aplica
          </button>
        </div>
      ) : (
        <div className="mt-2">
          <Input
            value={valorMencion(ficha, mencion)}
            onChange={(e) =>
              setFicha((f) => aplicarValorMencion(f, mencion, e.target.value))
            }
            placeholder="Escribe aquí…"
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setVerPorque((v) => !v)}
        className="mt-2 block text-xs text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
      >
        {verPorque ? "Ocultar" : "¿Por qué me piden esto?"}
      </button>
      {verPorque ? (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {mencion.explicacion}{" "}
          <span className="text-zinc-400 dark:text-zinc-500">
            ({mencion.baseLegal})
          </span>
        </p>
      ) : null}
    </div>
  );
}
