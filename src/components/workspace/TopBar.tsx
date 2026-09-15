"use client";

import { useEffect, useRef, useState } from "react";
import { CERTIFICACIONES, SECTORES } from "@/lib/matriz";
import type { Resumen } from "@/lib/workspace";
import { IconChevron, IconTag, IconX } from "@/components/workspace/icons";

export default function TopBar({
  nombreProducto,
  cliente,
  sectorId,
  certificaciones,
  resumen,
  onSector,
  onToggleCert,
  onVerEtiqueta,
}: {
  nombreProducto: string;
  cliente: string;
  sectorId: string;
  certificaciones: string[];
  resumen: Resumen;
  onSector: (id: string) => void;
  onToggleCert: (id: string) => void;
  onVerEtiqueta: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, [abierto]);

  const grupos = Array.from(new Set(SECTORES.map((s) => s.grupo)));
  const nombresCert = certificaciones
    .map((id) => CERTIFICACIONES.find((c) => c.id === id)?.nombre)
    .filter(Boolean) as string[];

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950 sm:px-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
          <IconTag className="h-4 w-4" />
        </span>
        <div className="hidden sm:block">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Etiquetas</p>
        </div>
      </div>

      <div className="mx-1 hidden h-6 w-px bg-zinc-200 dark:bg-zinc-800 sm:block" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{nombreProducto}</p>
        <p className="truncate text-[11px] text-zinc-500">{cliente}</p>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <label className="relative">
          <span className="sr-only">Tipo de producto</span>
          <select
            value={sectorId}
            onChange={(e) => onSector(e.target.value)}
            className="max-w-[16rem] appearance-none truncate rounded-lg border border-zinc-300 bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-zinc-800 outline-none transition hover:border-zinc-400 focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {grupos.map((g) => (
              <optgroup key={g} label={g}>
                {SECTORES.filter((s) => s.grupo === g).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <IconChevron className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        </label>

        <div ref={ref} className="relative">
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-label="Certificaciones y claims"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white py-1.5 pl-3 pr-2.5 text-xs font-medium text-zinc-800 transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {nombresCert.length ? (
              <span className="max-w-[10rem] truncate">{nombresCert.join(", ")}</span>
            ) : (
              <span className="text-zinc-500">Certificaciones</span>
            )}
            {nombresCert.length ? (
              <span className="rounded-full bg-zinc-900 px-1.5 text-[10px] text-white dark:bg-zinc-100 dark:text-zinc-900">
                {nombresCert.length}
              </span>
            ) : null}
            <IconChevron className="h-3.5 w-3.5 text-zinc-400" />
          </button>
          {abierto ? (
            <div className="absolute right-0 z-30 mt-1.5 w-72 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Certificaciones y claims
                </p>
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  aria-label="Cerrar"
                  className="rounded p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100"
                >
                  <IconX className="h-3.5 w-3.5" />
                </button>
              </div>
              <ul className="max-h-72 overflow-y-auto">
                {CERTIFICACIONES.map((c) => {
                  const activa = certificaciones.includes(c.id);
                  return (
                    <li key={c.id}>
                      <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                        <input
                          type="checkbox"
                          checked={activa}
                          onChange={() => onToggleCert(c.id)}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-300 accent-zinc-900 dark:accent-zinc-100"
                        />
                        <span className="min-w-0">
                          <span className="block text-xs font-medium text-zinc-800 dark:text-zinc-100">
                            {c.nombre}
                          </span>
                          <span className="block truncate text-[10px] text-zinc-500">
                            {c.mencionesExtra.length}{" "}
                            {c.mencionesExtra.length === 1 ? "mención extra" : "menciones extra"} ·{" "}
                            {c.normativa[0]}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className="hidden items-center gap-3 lg:flex">
        <div className="w-28">
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>Obligatorios</span>
            <span className="tabular-nums">
              {resumen.obligatoriosCubiertos}/{resumen.obligatorios}
            </span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-100"
              style={{
                width: `${resumen.obligatorios ? (resumen.obligatoriosCubiertos / resumen.obligatorios) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onVerEtiqueta}
        className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        <IconTag className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Vista previa</span>
      </button>
    </header>
  );
}
