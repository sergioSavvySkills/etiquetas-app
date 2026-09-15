"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  horaCorta,
  type AccionMensaje,
  type Documento,
  type EstadoItem,
  type Mensaje,
  type Requisito,
} from "@/lib/workspace";
import DocumentoCard from "@/components/workspace/DocumentoCard";
import { EstadoPunto } from "@/components/workspace/EstadoBadge";
import {
  IconPaperclip,
  IconSend,
  IconSparkles,
  IconUpload,
  IconX,
} from "@/components/workspace/icons";

export default function ChatPanel({
  mensajes,
  documentos,
  requisitos,
  estados,
  borrador,
  onBorrador,
  sugerencias,
  onEnviar,
  onAccion,
  onVerDocumento,
  onVerRequisito,
}: {
  mensajes: Mensaje[];
  documentos: Record<string, Documento>;
  requisitos: Requisito[];
  estados: Record<string, EstadoItem>;
  borrador: string;
  onBorrador: (v: string) => void;
  sugerencias: string[];
  onEnviar: (texto: string, ficheros: File[]) => void;
  onAccion: (a: AccionMensaje) => void;
  onVerDocumento: (id: string) => void;
  onVerRequisito: (id: string) => void;
}) {
  const [ficheros, setFicheros] = useState<File[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const porId = new Map(requisitos.map((r) => [r.id, r]));

  const ultimoEscribiendo = mensajes[mensajes.length - 1]?.escribiendo ?? false;
  useEffect(() => {
    finRef.current?.scrollIntoView({ block: "end" });
  }, [mensajes.length, ultimoEscribiendo]);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [borrador]);

  const puedeEnviar = borrador.trim().length > 0 || ficheros.length > 0;

  const enviar = () => {
    if (!puedeEnviar) return;
    onEnviar(borrador.trim(), ficheros);
    onBorrador("");
    setFicheros([]);
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  const añadirFicheros = (lista: FileList | null) => {
    if (!lista) return;
    setFicheros((f) => [...f, ...Array.from(lista)]);
  };

  return (
    <section
      className="relative flex h-full min-h-0 flex-col bg-zinc-50 dark:bg-zinc-900"
      onDragOver={(e) => {
        e.preventDefault();
        setArrastrando(true);
      }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={(e) => {
        e.preventDefault();
        setArrastrando(false);
        añadirFicheros(e.dataTransfer.files);
      }}
    >
      {arrastrando ? (
        <div className="pointer-events-none absolute inset-2 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-zinc-400 bg-white/80 backdrop-blur-sm dark:border-zinc-500 dark:bg-zinc-900/80">
          <div className="flex flex-col items-center gap-2 text-zinc-600 dark:text-zinc-300">
            <IconUpload className="h-6 w-6" />
            <p className="text-sm font-medium">Suelta aquí los documentos</p>
            <p className="text-xs text-zinc-500">PDF, imágenes u hojas de cálculo</p>
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          {mensajes.map((m) => (
            <Burbuja
              key={m.id}
              mensaje={m}
              documentos={documentos}
              porId={porId}
              estados={estados}
              onAccion={onAccion}
              onVerDocumento={onVerDocumento}
              onVerRequisito={onVerRequisito}
            />
          ))}
          {mensajes.length <= 1 ? (
            <label className="mx-auto mt-2 flex w-full max-w-md cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed border-zinc-300 px-6 py-8 text-center text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-700 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-200">
              <IconUpload className="h-5 w-5" />
              <span className="text-sm font-medium">Arrastra aquí la ficha técnica del proveedor</span>
              <span className="text-xs">o cualquier analítica, foto o certificado. PDF, imagen u hoja de cálculo.</span>
              <input
                type="file"
                multiple
                hidden
                onChange={(e) => {
                  añadirFicheros(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          ) : null}
          <div ref={finRef} />
        </div>
      </div>

      <div className="border-t border-zinc-200 bg-white px-4 pb-4 pt-3 dark:border-zinc-800 dark:bg-zinc-950 sm:px-6">
        <div className="mx-auto max-w-2xl">
          {sugerencias.length && !borrador ? (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {sugerencias.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    onBorrador(s);
                    areaRef.current?.focus();
                  }}
                  className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-500"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          {ficheros.length ? (
            <ul className="mb-2 flex flex-wrap gap-1.5">
              {ficheros.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  <IconPaperclip className="h-3 w-3 text-zinc-400" />
                  <span className="max-w-[12rem] truncate">{f.name}</span>
                  <button
                    type="button"
                    aria-label={`Quitar ${f.name}`}
                    onClick={() => setFicheros((l) => l.filter((_, j) => j !== i))}
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100"
                  >
                    <IconX className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex items-end gap-2 rounded-2xl border border-zinc-300 bg-white p-2 shadow-sm focus-within:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus-within:border-zinc-500">
            <input
              ref={inputRef}
              type="file"
              multiple
              hidden
              accept=".pdf,image/*,.xls,.xlsx,.csv"
              onChange={(e) => {
                añadirFicheros(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              title="Adjuntar documentos"
              aria-label="Adjuntar documentos"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <IconPaperclip className="h-4 w-4" />
            </button>
            <textarea
              ref={areaRef}
              value={borrador}
              onChange={(e) => onBorrador(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              placeholder="Escribe un dato, pega un texto o adjunta documentos…"
              className="max-h-40 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={enviar}
              disabled={!puedeEnviar}
              aria-label="Enviar"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              <IconSend className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-zinc-400">
            Intro para enviar · Mayús + Intro para salto de línea · Arrastra ficheros al chat
          </p>
        </div>
      </div>
    </section>
  );
}

function Burbuja({
  mensaje: m,
  documentos,
  porId,
  estados,
  onAccion,
  onVerDocumento,
  onVerRequisito,
}: {
  mensaje: Mensaje;
  documentos: Record<string, Documento>;
  porId: Map<string, Requisito>;
  estados: Record<string, EstadoItem>;
  onAccion: (a: AccionMensaje) => void;
  onVerDocumento: (id: string) => void;
  onVerRequisito: (id: string) => void;
}) {
  const usuario = m.autor === "usuario";
  return (
    <article className={`flex gap-3 ${usuario ? "flex-row-reverse" : ""}`}>
      {!usuario ? (
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
          <IconSparkles className="h-3.5 w-3.5" />
        </span>
      ) : null}
      <div className={`min-w-0 max-w-[85%] ${usuario ? "items-end" : ""} flex flex-col gap-2`}>
        {m.escribiendo ? (
          <div className="flex items-center gap-1 rounded-2xl bg-white px-3.5 py-3 shadow-sm dark:bg-zinc-800">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        ) : (
          <div
            className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
              usuario
                ? "rounded-tr-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "rounded-tl-md bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
            }`}
          >
            {m.texto}
          </div>
        )}

        {m.adjuntos?.length ? (
          <ul className="flex w-full flex-col gap-1.5">
            {m.adjuntos.map((id) => {
              const d = documentos[id];
              return d ? (
                <li key={id}>
                  <DocumentoCard doc={d} compacto onClick={() => onVerDocumento(id)} />
                </li>
              ) : null;
            })}
          </ul>
        ) : null}

        {m.requisitosRef?.length ? (
          <ul className="flex flex-wrap gap-1.5">
            {m.requisitosRef.map((id) => {
              const r = porId.get(id);
              if (!r) return null;
              const e = estados[id]?.estado ?? "pendiente";
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onVerRequisito(id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-600 transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                  >
                    <EstadoPunto estado={e} />
                    {r.titulo}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        {m.acciones?.length ? (
          <ul className="flex flex-wrap gap-1.5">
            {m.acciones.map((a) => (
              <li key={`${a.documentoId}-${a.requisitoId}`}>
                <button
                  type="button"
                  onClick={() => onAccion(a)}
                  className="rounded-lg border border-zinc-900 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-900 transition hover:bg-zinc-900 hover:text-white dark:border-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-100 dark:hover:text-zinc-900"
                >
                  {a.etiqueta}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {!m.escribiendo ? (
          <time
            suppressHydrationWarning
            className={`text-[10px] text-zinc-400 ${usuario ? "text-right" : ""}`}
          >
            {horaCorta(m.hora)}
          </time>
        ) : null}
      </div>
    </article>
  );
}
