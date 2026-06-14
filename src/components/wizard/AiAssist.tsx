"use client";

import { useState } from "react";
import { improveCampo, type ImproveResult } from "@/lib/ai";

type Props = {
  /** Etiqueta del campo (la ve la IA), p. ej. "Modo de empleo". */
  field: string;
  value: string;
  context?: string;
  onApply: (value: string) => void;
};

/** Botón inline para validar/mejorar el valor de un campo con la IA. */
export default function AiAssist({ field, value, context, onApply }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImproveResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await improveCampo(field, value, context));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={run}
        disabled={loading || !value.trim()}
        className="inline-flex items-center gap-1.5 rounded-md border border-violet-300 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300"
      >
        <span aria-hidden>✨</span>
        {loading ? "Revisando…" : "Validar y mejorar con IA"}
      </button>

      {error ? (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {result ? (
        <div className="mt-2 rounded-lg border border-violet-200 bg-violet-50/60 p-3 text-sm dark:border-violet-900 dark:bg-violet-950/30">
          <p className="text-xs text-violet-700 dark:text-violet-300">
            {result.feedback}
          </p>
          {result.suggestion && result.suggestion !== value ? (
            <div className="mt-2">
              <p className="rounded-md bg-white p-2 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                {result.suggestion}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onApply(result.suggestion);
                    setResult(null);
                  }}
                  className="rounded-md bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-violet-700"
                >
                  Aplicar
                </button>
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="rounded-md px-2.5 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  Descartar
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
