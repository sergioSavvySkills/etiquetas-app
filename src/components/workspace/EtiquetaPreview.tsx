"use client";

import type { EstadoItem, Requisito, Resumen } from "@/lib/workspace";
import { IconTag } from "@/components/workspace/icons";

function valor(
  estados: Record<string, EstadoItem>,
  id: string,
  etiqueta?: string,
): string | undefined {
  const item = estados[id];
  if (!item || item.estado !== "verificado") return undefined;
  const d = etiqueta
    ? item.datos.find((x) => x.etiqueta === etiqueta)
    : item.datos[0];
  return d?.valor;
}

export default function EtiquetaPreview({
  nombreProducto,
  requisitos,
  estados,
  resumen,
  onVerRequisito,
}: {
  nombreProducto: string;
  requisitos: Requisito[];
  estados: Record<string, EstadoItem>;
  resumen: Resumen;
  onVerRequisito: (id: string) => void;
}) {
  const v = (id: string, etiqueta?: string) => valor(estados, id, etiqueta);
  const activos = new Set(
    requisitos
      .filter((r) => estados[r.id]?.estado !== "no_aplica")
      .map((r) => r.id),
  );
  const faltan = requisitos.filter(
    (r) =>
      r.obligatoria &&
      !["verificado", "no_aplica"].includes(estados[r.id]?.estado ?? "pendiente"),
  );
  const nutri = estados.info_nutricional?.estado === "verificado" ? estados.info_nutricional.datos : [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b border-zinc-200 px-5 pb-4 pt-4 dark:border-zinc-800">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          Resultado
        </p>
        <h2 className="mt-1 flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          <IconTag className="h-4 w-4" />
          Vista previa de la etiqueta
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Se rellena sola con los requisitos verificados. Lo que falta aparece marcado.
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {/* Etiqueta */}
        <div className="rounded-lg border border-zinc-300 bg-[#fbfaf6] p-4 text-[11px] leading-snug text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-100">
          <p className="text-[15px] font-bold leading-tight">{nombreProducto}</p>
          <Campo id="denominacion" activos={activos} onVer={onVerRequisito} texto={v("denominacion", "Denominación legal")} pendiente="Denominación legal" className="italic" />
          {activos.has("porcentaje_fruta") ? (
            <div className="mt-1">
              <Campo id="porcentaje_fruta" activos={activos} onVer={onVerRequisito} texto={v("porcentaje_fruta", "Mención")} pendiente="% de fruta" />
              <Campo id="porcentaje_fruta" activos={activos} onVer={onVerRequisito} texto={v("porcentaje_fruta", "Azúcares totales")} pendiente="Azúcares totales" />
            </div>
          ) : null}

          <div className="mt-3">
            <span className="font-bold">Ingredientes: </span>
            <Campo id="lista_ingredientes" activos={activos} onVer={onVerRequisito} inline texto={v("lista_ingredientes")} pendiente="lista de ingredientes" />
          </div>
          <div className="mt-1">
            <Campo
              id="alergenos"
              activos={activos}
              onVer={onVerRequisito}
              inline
              texto={
                v("alergenos", "Puede contener")
                  ? `Puede contener ${v("alergenos", "Puede contener")?.toLowerCase()}.`
                  : undefined
              }
              pendiente={estados.alergenos?.estado === "verificado" ? undefined : "alérgenos"}
            />
          </div>

          {nutri.length ? (
            <table className="mt-3 w-full border-collapse border border-zinc-800 text-[10px]">
              <thead>
                <tr>
                  <th className="border border-zinc-800 px-1.5 py-0.5 text-left font-bold">Información nutricional</th>
                  <th className="border border-zinc-800 px-1.5 py-0.5 text-right font-bold">por 100 g</th>
                </tr>
              </thead>
              <tbody>
                {nutri.map((d) => (
                  <tr key={d.etiqueta}>
                    <td className={`border border-zinc-800 px-1.5 py-0.5 ${d.etiqueta.startsWith("de l") ? "pl-4" : ""}`}>
                      {d.etiqueta}
                    </td>
                    <td className="border border-zinc-800 px-1.5 py-0.5 text-right tabular-nums">{d.valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="mt-3">
              <Campo id="info_nutricional" activos={activos} onVer={onVerRequisito} texto={undefined} pendiente="Tabla de información nutricional" />
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Campo id="fecha_duracion" activos={activos} onVer={onVerRequisito} texto={v("fecha_duracion", "Mención propuesta")} pendiente="Consumir preferentemente antes de…" />
            <Campo id="lote" activos={activos} onVer={onVerRequisito} texto={v("lote") ? `Lote: ${v("lote")}` : undefined} pendiente="Lote" />
          </div>
          <div className="mt-1">
            <Campo id="conservacion" activos={activos} onVer={onVerRequisito} texto={v("conservacion")} pendiente="Condiciones de conservación" />
          </div>
          {activos.has("modo_empleo") && v("modo_empleo") ? (
            <div className="mt-1">
              <Campo id="modo_empleo" activos={activos} onVer={onVerRequisito} texto={v("modo_empleo")} />
            </div>
          ) : null}

          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Campo
                id="responsable"
                activos={activos}
                onVer={onVerRequisito}
                texto={
                  v("responsable", "Responsable")
                    ? `${v("responsable", "Responsable")} · ${v("responsable", "Dirección") ?? ""}`
                    : undefined
                }
                pendiente="Empresa responsable y dirección"
              />
              <Campo id="registro_sanitario" activos={activos} onVer={onVerRequisito} texto={v("registro_sanitario") ? `RGSEAA ${v("registro_sanitario")}` : undefined} pendiente="Nº RGSEAA" />
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[16px] font-bold leading-none">
                {v("cantidad_neta") ?? (
                  <PendienteInline id="cantidad_neta" activos={activos} onVer={onVerRequisito} texto="Cantidad neta" />
                )}
                {v("cantidad_neta") ? <span className="ml-1 text-[11px] font-normal">℮</span> : null}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-end justify-between gap-2">
            <CodigoBarras valor={v("ean")} />
            {activos.has("artesano_justificado") ? (
              <Campo id="artesano_justificado" activos={activos} onVer={onVerRequisito} texto={v("artesano_justificado") ? "Producto artesano" : undefined} pendiente="Sello artesano" />
            ) : null}
          </div>
        </div>

        {/* Estado */}
        <div className="mt-4">
          {faltan.length ? (
            <>
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                Faltan {faltan.length} {faltan.length === 1 ? "requisito obligatorio" : "requisitos obligatorios"} para generar la etiqueta:
              </p>
              <ul className="mt-2 space-y-1">
                {faltan.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => onVerRequisito(r.id)}
                      className="flex w-full items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-left text-xs text-amber-900 transition hover:border-amber-400 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      {r.titulo}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
              Todos los requisitos obligatorios están cubiertos ({resumen.obligatoriosCubiertos}/{resumen.obligatorios}). Ya puedes generar la etiqueta.
            </p>
          )}
        </div>
      </div>

      <footer className="border-t border-zinc-200 px-5 py-3 dark:border-zinc-800">
        <button
          type="button"
          disabled={faltan.length > 0}
          title={faltan.length ? `Faltan ${faltan.length} requisitos obligatorios` : "Generar etiqueta"}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Generar etiqueta
        </button>
        <p className="mt-1.5 text-center text-[10px] text-zinc-400">
          Genera la ficha técnica y el arte final a partir de los datos verificados.
        </p>
      </footer>
    </div>
  );
}

function Campo({
  id,
  activos,
  onVer,
  texto,
  pendiente,
  inline = false,
  className = "",
}: {
  id: string;
  activos: Set<string>;
  onVer: (id: string) => void;
  texto?: string;
  pendiente?: string;
  inline?: boolean;
  className?: string;
}) {
  if (!activos.has(id)) return null;
  if (texto) {
    return inline ? (
      <span className={className}>{texto}</span>
    ) : (
      <p className={className}>{texto}</p>
    );
  }
  if (!pendiente) return null;
  return <PendienteInline id={id} activos={activos} onVer={onVer} texto={pendiente} block={!inline} />;
}

function PendienteInline({
  id,
  onVer,
  texto,
  block = false,
}: {
  id: string;
  activos: Set<string>;
  onVer: (id: string) => void;
  texto: string;
  block?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onVer(id)}
      title="Pendiente · pulsa para ver el requisito"
      className={`rounded border border-dashed border-amber-500 bg-amber-100/70 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 transition hover:bg-amber-200 ${
        block ? "my-0.5 block w-full text-left" : "inline"
      }`}
    >
      Pendiente: {texto}
    </button>
  );
}

function CodigoBarras({ valor }: { valor?: string }) {
  const digitos = (valor ?? "0000000000000").split("").map(Number);
  return (
    <div className={`flex flex-col items-start ${valor ? "" : "opacity-40"}`}>
      <div className="flex h-8 items-end gap-px">
        {digitos.flatMap((d, i) =>
          [1, 2, 1, 3].map((w, j) => (
            <span
              key={`${i}-${j}`}
              className="bg-zinc-900"
              style={{ width: `${((d + j) % 3) + 1}px`, height: j === 3 ? "100%" : `${70 + ((d * w) % 30)}%` }}
            />
          )),
        )}
      </div>
      <span className="mt-0.5 text-[9px] tabular-nums tracking-widest">{valor ?? "EAN pendiente"}</span>
    </div>
  );
}
