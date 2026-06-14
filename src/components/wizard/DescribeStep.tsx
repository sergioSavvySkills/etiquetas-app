"use client";

import { useState } from "react";
import { describeProducto, type DescribeResult } from "@/lib/ai";
import { TextArea } from "@/components/ui";

type Props = {
  defaultText: string;
  onApply: (result: DescribeResult, text: string) => void;
  onSkip: () => void;
};

export default function DescribeStep({ defaultText, onApply, onSkip }: Props) {
  const [text, setText] = useState(defaultText);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DescribeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const r = await describeProducto(text);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <TextArea
        autoFocus
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setResult(null);
        }}
        placeholder="Ej. Mermelada artesanal de fresa en tarro de vidrio de 250 g. Lleva fresa (55%), azúcar y pectina. Se conserva a temperatura ambiente y, una vez abierta, en nevera. Caduca a los 24 meses."
        className="min-h-36 text-base"
      />

      {error ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900 dark:bg-violet-950/30">
          <p className="text-sm text-violet-800 dark:text-violet-200">
            <span aria-hidden>✨ </span>
            {result.resumen}
          </p>
          {result.simulado ? (
            <p className="mt-2 text-xs text-violet-600/80 dark:text-violet-400/80">
              Asistente en modo demo. Configura una clave de IA para un análisis completo.
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => onApply(result, text)}
            className="mt-3 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Continuar con estos datos →
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={analyze}
            disabled={loading || !text.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden>✨</span>
            {loading ? "Analizando…" : "Analizar con IA"}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-medium text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
          >
            Prefiero rellenarlo a mano
          </button>
        </div>
      )}
    </div>
  );
}
