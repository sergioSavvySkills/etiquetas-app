"use client";

import { useState } from "react";
import { crearFichaDemo, crearFichaVacia, type FichaTecnica } from "@/lib/ficha";
import FichaForm from "@/components/FichaForm";
import FichaPreview from "@/components/FichaPreview";

export default function GeneradorFicha() {
  const [ficha, setFicha] = useState<FichaTecnica>(crearFichaVacia);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Generador de fichas técnicas
          </h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            Captura la información del producto alimenticio para generar su ficha
            técnica. El fabricante la usará para elaborar la etiqueta.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFicha(crearFichaDemo())}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cargar ejemplo
          </button>
          <button
            type="button"
            onClick={() => setFicha(crearFichaVacia())}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Limpiar
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FichaForm ficha={ficha} setFicha={setFicha} />
        <div className="lg:sticky lg:top-6 lg:self-start">
          <FichaPreview ficha={ficha} />
        </div>
      </div>
    </div>
  );
}
