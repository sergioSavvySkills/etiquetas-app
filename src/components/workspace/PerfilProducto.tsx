"use client";

import { useState } from "react";
import type { Atributos } from "@/lib/workspace";
import { IconChevron, IconSparkles } from "@/components/workspace/icons";

const CONSERVACION: { id: Atributos["conservacion"]; nombre: string }[] = [
  { id: "ambiente", nombre: "Ambiente" },
  { id: "refrigerado", nombre: "Refrigerado" },
  { id: "congelado", nombre: "Congelado" },
];

const BOOLEANOS: { id: keyof Omit<Atributos, "conservacion">; nombre: string; ayuda: string }[] = [
  { id: "listoParaConsumo", nombre: "Listo para consumo", ayuda: "Se come sin cocinar ni preparar." },
  { id: "contieneAlcohol", nombre: "Más de 1,2 % vol. de alcohol", ayuda: "Activa el grado alcohólico y exime del nutricional." },
  { id: "llevaClaims", nombre: "Lleva claims", ayuda: "Declaraciones nutricionales o de salud." },
  { id: "liquidoCobertura", nombre: "Líquido de cobertura", ayuda: "Aceite, salmuera, almíbar… Pide peso escurrido." },
  { id: "ingredienteUnicoSinTransformar", nombre: "Un solo ingrediente sin transformar", ayuda: "Fruta fresca, miel, carne fresca… Exime del nutricional." },
];

/** Atributos del producto que hacen dinámica la lista de requisitos. */
export default function PerfilProducto({
  atributos,
  onChange,
}: {
  atributos: Atributos;
  onChange: (a: Atributos) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const activos = [
    CONSERVACION.find((c) => c.id === atributos.conservacion)?.nombre ?? "",
    ...BOOLEANOS.filter((b) => atributos[b.id]).map((b) => b.nombre),
  ];

  return (
    <section className="mb-2 rounded-lg border border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/60">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex w-full items-start gap-2 px-3 py-2 text-left"
      >
        <IconSparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Perfil del producto
          </span>
          {!abierto ? (
            <span className="mt-0.5 block truncate text-[11px] text-zinc-600 dark:text-zinc-300">
              {activos.join(" · ")}
            </span>
          ) : (
            <span className="mt-0.5 block text-[11px] text-zinc-500">
              Lo deduce el asistente de la ficha técnica. Corrígelo y la lista de requisitos se recalcula.
            </span>
          )}
        </span>
        <IconChevron className={`mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform ${abierto ? "rotate-180" : ""}`} />
      </button>

      {abierto ? (
        <div className="space-y-3 border-t border-zinc-200 px-3 pb-3 pt-2.5 dark:border-zinc-800">
          <div>
            <p className="mb-1.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">Conservación</p>
            <div className="grid grid-cols-3 gap-1">
              {CONSERVACION.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onChange({ ...atributos, conservacion: c.id })}
                  aria-pressed={atributos.conservacion === c.id}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                    atributos.conservacion === c.id
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:ring-zinc-400 dark:bg-zinc-950 dark:text-zinc-300 dark:ring-zinc-700"
                  }`}
                >
                  {c.nombre}
                </button>
              ))}
            </div>
          </div>
          <ul className="space-y-1">
            {BOOLEANOS.map((b) => (
              <li key={b.id}>
                <label className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1 hover:bg-white dark:hover:bg-zinc-950">
                  <input
                    type="checkbox"
                    checked={atributos[b.id]}
                    onChange={(e) => onChange({ ...atributos, [b.id]: e.target.checked })}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-zinc-300 accent-zinc-900 dark:accent-zinc-100"
                  />
                  <span className="min-w-0">
                    <span className="block text-[12px] text-zinc-800 dark:text-zinc-100">{b.nombre}</span>
                    <span className="block text-[10px] leading-snug text-zinc-500">{b.ayuda}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
