"use client";

import type { ReactNode } from "react";

type Props = {
  stepIndex: number;
  total: number;
  question: string;
  help?: string;
  children: ReactNode;
  onBack: () => void;
  onNext: () => void;
  canAdvance?: boolean;
  nextLabel?: string;
  /** Oculta el botón de continuar (cuando el paso avanza por otra acción). */
  hideNext?: boolean;
};

export default function StepShell({
  stepIndex,
  total,
  question,
  help,
  children,
  onBack,
  onNext,
  canAdvance = true,
  nextLabel = "Continuar",
  hideNext = false,
}: Props) {
  const progress = Math.round((stepIndex / (total - 1)) * 100);

  return (
    <div
      className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col px-5 py-6"
      onKeyDown={(e) => {
        // Enter avanza, salvo dentro de un textarea (donde sirve para saltos de línea).
        if (
          e.key === "Enter" &&
          !e.shiftKey &&
          (e.target as HTMLElement).tagName !== "TEXTAREA" &&
          canAdvance &&
          !hideNext
        ) {
          e.preventDefault();
          onNext();
        }
      }}
    >
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
          <span className="font-medium">Ficha técnica</span>
          <span>
            {stepIndex + 1} / {total}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          {question}
        </h1>
        {help ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{help}</p>
        ) : null}
        <div className="mt-7">{children}</div>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={stepIndex === 0}
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Atrás
        </button>
        {!hideNext ? (
          <button
            type="button"
            onClick={onNext}
            disabled={!canAdvance}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {nextLabel}
            <span className="text-xs opacity-70">↵</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
