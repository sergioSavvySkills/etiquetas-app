"use client";

import { useState } from "react";
import {
  ESTADOS,
  FASES,
  fechaCorta,
  type Documento,
  type EstadoItem,
  type EstadoRequisito,
  type Requisito,
} from "@/lib/workspace";
import { IconDoubleCheck, IconShield, IconWand } from "@/components/workspace/icons";
import EditorRequisito, { nombreEditor, type Guardado } from "@/components/workspace/Editores";
import DocumentoCard, { IconoDocumento } from "@/components/workspace/DocumentoCard";
import { EstadoChip, EstadoPunto } from "@/components/workspace/EstadoBadge";
import {
  IconAlert,
  IconBook,
  IconChat,
  IconChevronRight,
  IconInfo,
  IconUpload,
  IconX,
} from "@/components/workspace/icons";

/* ------------------------------------------------------------------ */
/* Detalle de un requisito                                              */
/* ------------------------------------------------------------------ */

export function DetalleRequisito({
  requisito: r,
  item,
  documentos,
  onCerrar,
  onEstado,
  onGuardar,
  onAprobar,
  onRechazar,
  onRetirarAprobacion,
  usuario,
  editarInicial = false,
  onAdjuntar,
  onPreguntar,
  onVerDocumento,
}: {
  requisito: Requisito;
  item: EstadoItem;
  documentos: Record<string, Documento>;
  onCerrar: () => void;
  onEstado: (estado: EstadoRequisito, nota?: string) => void;
  onGuardar: (g: Guardado) => void;
  editarInicial?: boolean;
  onAprobar: () => void;
  onRechazar: (motivo: string) => void;
  onRetirarAprobacion: () => void;
  usuario: { nombre: string; rol: string };
  onAdjuntar: (ficheros: File[]) => void;
  onPreguntar: (texto: string) => void;
  onVerDocumento: (id: string) => void;
}) {
  const [editando, setEditando] = useState(editarInicial);
  const [rechazando, setRechazando] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const fase = FASES.find((f) => f.id === r.fase);
  const docs = item.documentoIds.map((id) => documentos[id]).filter(Boolean);
  const noAplica = item.estado === "no_aplica";
  const porConfirmar = item.estado === "verificado";
  const aprobado = item.estado === "aprobado";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b border-zinc-200 px-5 pb-4 pt-4 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            {fase?.nombre}
          </p>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar detalle"
            className="-mr-1 -mt-1 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>
        <h2 className="mt-1 text-base font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
          {r.titulo}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <EstadoChip estado={item.estado} />
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              r.obligatoria
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {r.obligatoria ? "Obligatorio" : "Recomendado"}
          </span>
        </div>
        <p className="mt-2 text-xs text-zinc-500">{r.motivo}</p>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {porConfirmar ? (
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 dark:border-teal-900/60 dark:bg-teal-950/40">
            <div className="flex gap-2.5">
              <IconShield className="mt-0.5 h-4 w-4 shrink-0 text-teal-700 dark:text-teal-300" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-teal-900 dark:text-teal-200">Pendiente de tu aprobación</p>
                <p className="mt-0.5 text-xs leading-relaxed text-teal-800 dark:text-teal-300">
                  El asistente da estos datos por correctos, pero no pasan a la etiqueta hasta que una persona los confirme. Revisa los datos y los documentos y decide.
                </p>
              </div>
            </div>
            {!rechazando ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onAprobar}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                >
                  <IconDoubleCheck className="h-3.5 w-3.5" strokeWidth={3} />
                  Aprobar como {usuario.nombre.split(" ")[0]}
                </button>
                <button
                  type="button"
                  onClick={() => setRechazando(true)}
                  className="rounded-lg border border-teal-300 px-3 py-1.5 text-xs font-medium text-teal-900 transition hover:bg-white dark:border-teal-800 dark:text-teal-200 dark:hover:bg-teal-950"
                >
                  Rechazar
                </button>
              </div>
            ) : (
              <form
                className="mt-3 space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!motivoRechazo.trim()) return;
                  onRechazar(motivoRechazo.trim());
                  setRechazando(false);
                  setMotivoRechazo("");
                }}
              >
                <input
                  autoFocus
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="¿Qué está mal? (p. ej. el valor de sal no coincide con el informe)"
                  className="w-full rounded-lg border border-teal-300 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-teal-500 dark:border-teal-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={!motivoRechazo.trim()}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-40"
                  >
                    Marcar incidencia
                  </button>
                  <button
                    type="button"
                    onClick={() => setRechazando(false)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-white dark:text-zinc-300 dark:hover:bg-zinc-900"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : null}
        {(aprobado || noAplica) && item.aprobacion ? (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/40">
            <div className="flex gap-2.5">
              <IconDoubleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" strokeWidth={3} />
              <div>
                <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  {aprobado ? "Aprobado" : "Descartado"} por {item.aprobacion.por}
                </p>
                <p suppressHydrationWarning className="mt-0.5 text-xs text-emerald-800 dark:text-emerald-300">
                  {fechaCorta(item.aprobacion.fecha)} · {usuario.rol}
                </p>
              </div>
            </div>
            {aprobado ? (
              <button
                type="button"
                onClick={onRetirarAprobacion}
                className="shrink-0 text-[11px] font-medium text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300"
              >
                Retirar
              </button>
            ) : null}
          </div>
        ) : null}
        {noAplica && !item.aprobacion ? (
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 dark:border-teal-900/60 dark:bg-teal-950/40">
            <p className="text-xs font-semibold text-teal-900 dark:text-teal-200">El asistente propone que no aplica</p>
            <p className="mt-0.5 text-xs leading-relaxed text-teal-800 dark:text-teal-300">Confírmalo o vuelve a activarlo.</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => onEstado("no_aplica", item.nota)}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
              >
                Confirmar que no aplica
              </button>
              <button
                type="button"
                onClick={() => onEstado("pendiente")}
                className="rounded-lg border border-teal-300 px-3 py-1.5 text-xs font-medium text-teal-900 transition hover:bg-white dark:border-teal-800 dark:text-teal-200"
              >
                Sí aplica
              </button>
            </div>
          </div>
        ) : null}
        {item.estado === "incidencia" && item.nota ? (
          <Aviso tono="amber" icono={<IconAlert className="h-4 w-4" />} titulo="Necesita revisión manual">
            {item.nota}
          </Aviso>
        ) : null}
        {item.estado === "no_aplica" && item.nota ? (
          <Aviso tono="zinc" icono={<IconInfo className="h-4 w-4" />} titulo="No aplica a este producto">
            {item.nota}
          </Aviso>
        ) : null}
        {item.estado === "analizando" && item.nota ? (
          <Aviso tono="violet" icono={<IconInfo className="h-4 w-4" />} titulo="Analizando">
            {item.nota}
          </Aviso>
        ) : null}

        <Bloque titulo="Qué es y por qué se pide">
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">{r.descripcion}</p>
          {r.baseLegal ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-1 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <IconBook className="h-3 w-3" />
              {r.baseLegal}
            </p>
          ) : null}
        </Bloque>

        <Bloque titulo="Cómo se cubre">
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">{r.comoSeCubre}</p>
          {r.nota ? <p className="mt-1.5 text-xs text-zinc-500">{r.nota}</p> : null}
        </Bloque>

        {r.parametros?.length ? (
          <Bloque titulo="Qué debe incluir el informe">
            <ul className="space-y-1">
              {r.parametros.map((pm) => (
                <li
                  key={pm}
                  className="flex items-start gap-2 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-700 dark:border-zinc-800 dark:text-zinc-200"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                  {pm}
                </li>
              ))}
            </ul>
          </Bloque>
        ) : null}

        {/* Datos para la etiqueta: lectura o edición según el tipo de requisito */}
        {editando && !noAplica ? (
          <EditorRequisito
            key={r.id}
            requisito={r}
            item={item}
            onCancelar={() => setEditando(false)}
            onGuardar={(g) => {
              onGuardar(g);
              setEditando(false);
            }}
          />
        ) : (
          <Bloque titulo={item.datos.length ? "Datos para la etiqueta" : "Dato"}>
            {item.datos.length ? (
              <dl className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {item.datos.map((d) => (
                  <div key={d.etiqueta} className="grid grid-cols-[minmax(0,40%)_1fr] gap-3 px-3 py-2">
                    <dt className="text-xs text-zinc-500">{d.etiqueta}</dt>
                    <dd className="text-xs font-medium text-zinc-800 dark:text-zinc-100">{d.valor}</dd>
                  </div>
                ))}
              </dl>
            ) : !noAplica ? (
              <p className="text-xs text-zinc-500">Todavía no hay ningún valor. Puedes introducirlo a mano o adjuntar un documento.</p>
            ) : null}
            {!noAplica ? (
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <IconWand className="h-3.5 w-3.5" />
                {item.datos.length ? nombreEditor(r) : r.origen === "declaracion" ? "Elegir redacción" : "Introducir a mano"}
              </button>
            ) : null}
          </Bloque>
        )}

        <Bloque
          titulo={docs.length ? `Documentos vinculados · ${docs.length}` : "Documentos"}
        >
          {docs.length ? (
            <ul className="space-y-1.5">
              {docs.map((d) => (
                <li key={d.id}>
                  <DocumentoCard doc={d} onClick={() => onVerDocumento(d.id)} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500">
              Ningún documento vinculado todavía.
            </p>
          )}
          {!noAplica ? (
            <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 px-3 py-2.5 text-xs text-zinc-600 transition hover:border-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500">
              <IconUpload className="h-3.5 w-3.5" />
              Subir documento para este requisito
              <input
                type="file"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files?.length) onAdjuntar(Array.from(e.target.files));
                  e.target.value = "";
                }}
              />
            </label>
          ) : null}
        </Bloque>

      </div>

      <footer className="border-t border-zinc-200 px-5 py-3 dark:border-zinc-800">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onPreguntar(`Sobre «${r.titulo}»: `)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <IconChat className="h-3.5 w-3.5" />
            Preguntar en el chat
          </button>
          {noAplica ? (
            <button
              type="button"
              onClick={() => onEstado("pendiente")}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Volver a activar
            </button>
          ) : (
            <>
              {item.estado !== "incidencia" ? (
                <button
                  type="button"
                  onClick={() => onEstado("incidencia", "Marcado para revisión manual por el usuario.")}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Revisión manual
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onEstado("aprobado")}
                  className="rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950"
                >
                  Resuelto y aprobado
                </button>
              )}
              <button
                type="button"
                onClick={() => onEstado("no_aplica", "Descartado por el usuario.")}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                No aplica
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Detalle de un documento                                              */
/* ------------------------------------------------------------------ */

export function DetalleDocumento({
  doc,
  cubre,
  estados,
  onCerrar,
  onVerRequisito,
}: {
  doc: Documento;
  cubre: Requisito[];
  estados: Record<string, EstadoItem>;
  onCerrar: () => void;
  onVerRequisito: (id: string) => void;
}) {
  const [pagina, setPagina] = useState(1);
  const total = doc.paginas ?? 1;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b border-zinc-200 px-5 pb-4 pt-4 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Documento</p>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar documento"
            className="-mr-1 -mt-1 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>
        <h2 className="mt-1 break-all text-sm font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
          {doc.nombre}
        </h2>
        <p suppressHydrationWarning className="mt-1 text-xs text-zinc-500">
          Subido el {fechaCorta(doc.subidoEn)}
          {doc.paginas ? ` · ${doc.paginas} páginas` : ""}
        </p>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {/* Visor simulado */}
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-3 py-1.5 text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
            <span className="inline-flex items-center gap-1.5">
              <IconoDocumento tipo={doc.tipo} className="h-3.5 w-3.5" />
              Vista previa
            </span>
            {total > 1 ? (
              <span className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="rounded px-1 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
                  aria-label="Página anterior"
                >
                  ‹
                </button>
                <span className="tabular-nums">
                  {pagina} / {total}
                </span>
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.min(total, p + 1))}
                  disabled={pagina === total}
                  className="rounded px-1 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
                  aria-label="Página siguiente"
                >
                  ›
                </button>
              </span>
            ) : null}
          </div>
          <div className="p-4">
            <PaginaSimulada legible={doc.legible} tipo={doc.tipo} semilla={pagina} />
          </div>
        </div>

        {doc.resumen ? (
          <Bloque titulo="Lo que he entendido">
            <p
              className={`text-sm leading-relaxed ${
                doc.legible
                  ? "text-zinc-700 dark:text-zinc-200"
                  : "text-amber-800 dark:text-amber-300"
              }`}
            >
              {doc.resumen}
            </p>
          </Bloque>
        ) : null}

        {doc.extractos.length ? (
          <Bloque titulo="Datos extraídos">
            <dl className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {doc.extractos.map((d) => (
                <div key={d.etiqueta} className="grid grid-cols-[minmax(0,40%)_1fr] gap-3 px-3 py-2">
                  <dt className="text-xs text-zinc-500">{d.etiqueta}</dt>
                  <dd className="text-xs font-medium text-zinc-800 dark:text-zinc-100">{d.valor}</dd>
                </div>
              ))}
            </dl>
          </Bloque>
        ) : null}

        <Bloque titulo={cubre.length ? `Cubre ${cubre.length} ${cubre.length === 1 ? "requisito" : "requisitos"}` : "Requisitos"}>
          {cubre.length ? (
            <ul className="space-y-1">
              {cubre.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => onVerRequisito(r.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    <EstadoPunto estado={estados[r.id]?.estado ?? "pendiente"} />
                    <span className="flex-1">{r.titulo}</span>
                    <IconChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500">
              Este documento aún no está vinculado a ningún requisito. Vincúlalo desde el chat.
            </p>
          )}
        </Bloque>
      </div>
    </div>
  );
}

function PaginaSimulada({
  legible,
  tipo,
  semilla,
}: {
  legible: boolean;
  tipo: Documento["tipo"];
  semilla: number;
}) {
  if (tipo === "imagen") {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded bg-gradient-to-br from-zinc-200 to-zinc-300 text-zinc-500 dark:from-zinc-800 dark:to-zinc-700">
        <IconoDocumento tipo="imagen" className="h-8 w-8" />
      </div>
    );
  }
  const anchos = [92, 70, 85, 60, 78, 88, 45, 82, 66, 74];
  return (
    <div className="relative mx-auto aspect-[1/1.3] w-full max-w-[240px] rounded bg-white p-4 shadow-sm dark:bg-zinc-950">
      <div className="mb-3 h-2 w-1/2 rounded bg-zinc-300 dark:bg-zinc-700" />
      <div className="space-y-1.5">
        {anchos.map((w, i) => (
          <div
            key={i}
            className={`h-1.5 rounded ${legible ? "bg-zinc-200 dark:bg-zinc-800" : "bg-zinc-300/70 blur-[1px] dark:bg-zinc-700/70"}`}
            style={{ width: `${((w + semilla * 7) % 55) + 40}%` }}
          />
        ))}
      </div>
      {legible ? (
        <div className="mt-4 grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-3 rounded-sm bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center rounded bg-white/70 backdrop-blur-[1px] dark:bg-zinc-950/70">
          <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Escaneado sin texto
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Piezas comunes                                                       */
/* ------------------------------------------------------------------ */

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        {titulo}
      </h3>
      {children}
    </section>
  );
}

function Aviso({
  tono,
  icono,
  titulo,
  children,
}: {
  tono: "amber" | "zinc" | "violet";
  icono: React.ReactNode;
  titulo: string;
  children: React.ReactNode;
}) {
  const cls = {
    amber: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
    zinc: "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
    violet: "border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-200",
  }[tono];
  return (
    <div className={`flex gap-2.5 rounded-lg border p-3 ${cls}`}>
      <span className="mt-0.5 shrink-0">{icono}</span>
      <div>
        <p className="text-xs font-semibold">{titulo}</p>
        <p className="mt-0.5 text-xs leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

export { ESTADOS };
