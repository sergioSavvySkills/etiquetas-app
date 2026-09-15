"use client";

import { useMemo, useState } from "react";
import {
  FASES,
  type Atributos,
  type EstadoItem,
  type Excluido,
  type FaseId,
  type Requisito,
  type Resumen,
} from "@/lib/workspace";
import { EstadoIcono } from "@/components/workspace/EstadoBadge";
import PerfilProducto from "@/components/workspace/PerfilProducto";
import { IconBan, IconChevron, IconFile, IconSearch } from "@/components/workspace/icons";

type Filtro = "todos" | "aprobados" | "pendientes" | "por_confirmar" | "incidencias";

export default function RequisitosPanel({
  requisitos,
  estados,
  resumen,
  excluidos,
  atributos,
  onAtributos,
  seleccionado,
  onSeleccionar,
  normativa,
}: {
  requisitos: Requisito[];
  estados: Record<string, EstadoItem>;
  resumen: Resumen;
  excluidos: Excluido[];
  atributos: Atributos;
  onAtributos: (a: Atributos) => void;
  seleccionado: string | null;
  onSeleccionar: (id: string) => void;
  normativa: string[];
}) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [plegadas, setPlegadas] = useState<Set<FaseId>>(new Set());

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return requisitos.filter((r) => {
      const e = estados[r.id]?.estado ?? "pendiente";
      if (filtro === "aprobados" && e !== "aprobado" && !(e === "no_aplica" && estados[r.id]?.aprobacion)) return false;
      if (filtro === "pendientes" && !["pendiente", "recibido", "analizando"].includes(e)) return false;
      if (filtro === "por_confirmar" && e !== "verificado" && !(e === "no_aplica" && !estados[r.id]?.aprobacion)) return false;
      if (filtro === "incidencias" && e !== "incidencia") return false;
      if (q && !`${r.titulo} ${r.descripcion} ${r.baseLegal ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [requisitos, estados, filtro, busqueda]);

  const togglePlegada = (id: FaseId) =>
    setPlegadas((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <aside className="flex h-full min-h-0 flex-col bg-white dark:bg-zinc-950">
      <div className="border-b border-zinc-200 px-4 pb-3 pt-4 dark:border-zinc-800">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Requisitos de la etiqueta
          </h2>
          {filtro !== "todos" ? (
            <button
              type="button"
              onClick={() => setFiltro("todos")}
              className="text-[11px] text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline dark:hover:text-zinc-100"
            >
              Quitar filtro
            </button>
          ) : (
            <span className="text-xs tabular-nums text-zinc-500">
              {resumen.cubiertos}/{resumen.total}
            </span>
          )}
        </div>

        {/* Barra segmentada por estado */}
        <div
          className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
          role="img"
          aria-label={`${resumen.cubiertos} aprobados, ${resumen.porConfirmar} por confirmar, ${resumen.incidencias} incidencias, ${resumen.pendientes} pendientes`}
        >
          {(
            [
              [resumen.cubiertos, "bg-emerald-600 dark:bg-emerald-500"],
              [resumen.porConfirmar, "bg-teal-400"],
              [resumen.incidencias, "bg-amber-400"],
            ] as [number, string][]
          ).map(([n, cls], i) =>
            n ? (
              <div
                key={i}
                className={`${cls} transition-all`}
                style={{ width: `${(n / Math.max(resumen.total, 1)) * 100}%` }}
              />
            ) : null,
          )}
        </div>
        <p className="mt-1.5 text-[11px] text-zinc-500">
          {resumen.obligatoriosCubiertos} de {resumen.obligatorios} obligatorios aprobados
        </p>

        {/* Contadores que filtran */}
        <div className="mt-3 grid grid-cols-4 gap-1">
          {(
            [
              ["aprobados", "Aprobados", resumen.cubiertos, "text-emerald-700 dark:text-emerald-400"],
              ["por_confirmar", "Por confirmar", resumen.porConfirmar, "text-teal-700 dark:text-teal-300"],
              ["pendientes", "Pendientes", resumen.pendientes, "text-zinc-700 dark:text-zinc-200"],
              ["incidencias", "Incidencias", resumen.incidencias, "text-amber-700 dark:text-amber-400"],
            ] as [Filtro, string, number, string][]
          ).map(([id, nombre, n, texto]) => {
            const activo = filtro === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setFiltro(activo ? "todos" : id)}
                aria-pressed={activo}
                title={activo ? "Quitar filtro" : `Ver solo ${nombre.toLowerCase()}`}
                className={`flex min-w-0 flex-col items-start overflow-hidden rounded-lg border px-1.5 py-1.5 text-left transition ${
                  activo
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
                }`}
              >
                <span className={`text-base font-semibold leading-none tabular-nums ${activo ? "" : texto}`}>{n}</span>
                <span className="mt-1 whitespace-nowrap text-[10px] leading-none tracking-tight text-current opacity-80">
                  {nombre}
                </span>
              </button>
            );
          })}
        </div>

        <label className="mt-3 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-500 focus-within:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
          <IconSearch className="h-3.5 w-3.5 shrink-0" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar requisito o norma…"
            className="w-full bg-transparent text-xs text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <PerfilProducto atributos={atributos} onChange={onAtributos} />

        {FASES.map((fase) => {
          const items = visibles.filter((r) => r.fase === fase.id);
          const excluidosFase = excluidos.filter((e) => e.fase === fase.id);
          if (!items.length && !excluidosFase.length) return null;
          const todosFase = requisitos.filter((r) => r.fase === fase.id);
          const hechos = todosFase.filter((r) =>
            ["aprobado", "no_aplica"].includes(estados[r.id]?.estado ?? "pendiente"),
          ).length;
          const plegada = plegadas.has(fase.id);
          return (
            <section key={fase.id} className="mb-1">
              <button
                type="button"
                onClick={() => togglePlegada(fase.id)}
                className="group flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900"
                aria-expanded={!plegada}
              >
                <IconChevron
                  className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${plegada ? "-rotate-90" : ""}`}
                />
                <span className="flex-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {fase.nombre}
                </span>
                <span className="text-[11px] tabular-nums text-zinc-400">
                  {hechos}/{todosFase.length}
                </span>
              </button>
              {!plegada ? (
                <ul className="mt-0.5 space-y-0.5">
                  {items.map((r) => {
                    const item = estados[r.id];
                    const estado = item?.estado ?? "pendiente";
                    const activo = seleccionado === r.id;
                    const atenuado = estado === "no_aplica";
                    return (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => onSeleccionar(r.id)}
                          aria-current={activo ? "true" : undefined}
                          className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition ${
                            activo
                              ? "bg-zinc-100 ring-1 ring-zinc-300 dark:bg-zinc-800 dark:ring-zinc-700"
                              : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                          }`}
                        >
                          <span className="mt-0.5">
                            <EstadoIcono estado={estado} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block truncate text-[13px] font-medium ${
                                atenuado
                                  ? "text-zinc-400 line-through dark:text-zinc-500"
                                  : "text-zinc-800 dark:text-zinc-100"
                              }`}
                            >
                              {r.titulo}
                            </span>
                            <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-500">
                              <span
                                className={
                                  r.obligatoria
                                    ? "text-zinc-600 dark:text-zinc-300"
                                    : "text-zinc-400"
                                }
                              >
                                {r.obligatoria ? "Obligatorio" : "Recomendado"}
                              </span>
                              {item?.documentoIds.length ? (
                                <span className="inline-flex items-center gap-0.5 text-zinc-400">
                                  <IconFile className="h-3 w-3" />
                                  {item.documentoIds.length}
                                </span>
                              ) : null}
                              {item?.nota && estado === "incidencia" ? (
                                <span className="truncate text-amber-600 dark:text-amber-400">
                                  Revisión manual
                                </span>
                              ) : null}
                              {estado === "verificado" ? (
                                <span className="truncate text-teal-600 dark:text-teal-400">
                                  Por confirmar
                                </span>
                              ) : null}
                              {estado === "aprobado" && item?.aprobacion ? (
                                <span className="truncate text-emerald-700 dark:text-emerald-400">
                                  {item.aprobacion.por.split(" ")[0]}
                                </span>
                              ) : null}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              {!plegada && excluidosFase.length && filtro === "todos" && !busqueda ? (
                <details className="mx-2 mt-1 rounded-md">
                  <summary className="cursor-pointer select-none px-1 py-1 text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                    No aplican a este producto · {excluidosFase.length}
                  </summary>
                  <ul className="mb-1 mt-0.5 space-y-1 pl-1">
                    {excluidosFase.map((e) => (
                      <li key={e.id} className="flex items-start gap-2 px-1 py-0.5">
                        <IconBan className="mt-0.5 h-3 w-3 shrink-0 text-zinc-300 dark:text-zinc-600" />
                        <span className="min-w-0">
                          <span className="block text-[12px] text-zinc-400 line-through dark:text-zinc-500">{e.titulo}</span>
                          <span className="block text-[10px] leading-snug text-zinc-400 dark:text-zinc-500">{e.motivo}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </section>
          );
        })}
        {!visibles.length ? (
          <p className="px-3 py-8 text-center text-xs text-zinc-400">
            Ningún requisito coincide con el filtro.
          </p>
        ) : null}
      </div>

      <footer className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          Normativa aplicable
        </p>
        <ul className="mt-1.5 flex flex-wrap gap-1">
          {normativa.map((n) => (
            <li
              key={n}
              className="rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:border-zinc-800 dark:text-zinc-300"
            >
              {n}
            </li>
          ))}
        </ul>
      </footer>
    </aside>
  );
}
