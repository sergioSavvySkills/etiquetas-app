"use client";

/**
 * Editores por tipo de dato. Cada requisito tiene su propia pantalla de
 * modificación: no es lo mismo corregir un nombre que reordenar ingredientes
 * o rellenar una tabla nutricional. Todos devuelven `Dato[]` (lo que va a la
 * etiqueta) y, si procede, una `estructura` tipada para reeditar sin perder
 * información.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ALERGENOS_UE } from "@/lib/ficha";
import type { Dato, EstadoItem, Requisito } from "@/lib/workspace";
import { IconChevron, IconX } from "@/components/workspace/icons";

export type Guardado = { datos: Dato[]; estructura?: Record<string, unknown> };

type Props = {
  requisito: Requisito;
  item: EstadoItem;
  onGuardar: (g: Guardado) => void;
  onCancelar: () => void;
};

/* ------------------------------------------------------------------ */
/* Selector                                                             */
/* ------------------------------------------------------------------ */

const TEXTOS = new Set(["conservacion", "transporte", "modo_empleo", "paletizado", "tipo_envase"]);

/** Nombre corto del tipo de editor, para el botón «Editar …». */
export function nombreEditor(r: Requisito): string {
  switch (r.id) {
    case "denominacion": return "Editar nombre";
    case "lista_ingredientes": return "Editar ingredientes";
    case "alergenos": return "Editar alérgenos";
    case "lab_nutricional": return "Editar tabla nutricional";
    case "cantidad_neta": return "Editar cantidad";
    case "lote": return "Editar lote";
    case "fecha_duracion": return "Editar fecha";
    case "responsable": return "Editar responsable";
    case "registro_sanitario": return "Editar RGSEAA";
    case "ean": return "Editar EAN";
  }
  if (TEXTOS.has(r.id)) return "Editar texto";
  if (r.origen === "declaracion") return "Editar mención";
  return "Editar valores";
}

export default function EditorRequisito(props: Props) {
  const { requisito: r } = props;
  switch (r.id) {
    case "denominacion": return <EditorNombre {...props} />;
    case "lista_ingredientes": return <EditorIngredientes {...props} />;
    case "alergenos": return <EditorAlergenos {...props} />;
    case "lab_nutricional": return <EditorNutricional {...props} />;
    case "cantidad_neta": return <EditorCantidad {...props} />;
    case "lote": return <EditorLote {...props} />;
    case "fecha_duracion": return <EditorFecha {...props} />;
    case "responsable": return <EditorResponsable {...props} />;
    case "registro_sanitario": return <EditorRegistro {...props} />;
    case "ean": return <EditorEan {...props} />;
  }
  if (TEXTOS.has(r.id)) return <EditorTexto {...props} />;
  if (r.origen === "declaracion") return <EditorDeclaracion {...props} />;
  return <EditorClaveValor {...props} />;
}

/* ------------------------------------------------------------------ */
/* Piezas comunes                                                       */
/* ------------------------------------------------------------------ */

const inputCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 outline-none transition focus:border-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400";

function Campo({ label, hint, children, error }: { label: string; hint?: string; children: ReactNode; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-[11px] text-rose-600 dark:text-rose-400">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[11px] text-zinc-400">{hint}</span>
      ) : null}
    </label>
  );
}

function Marco({
  titulo,
  children,
  onGuardar,
  onCancelar,
  puedeGuardar = true,
  vistaPrevia,
}: {
  titulo: string;
  children: ReactNode;
  onGuardar: () => void;
  onCancelar: () => void;
  puedeGuardar?: boolean;
  vistaPrevia?: ReactNode;
}) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, []);
  return (
    <form
      ref={ref}
      className="scroll-mt-3 rounded-lg border border-zinc-300 bg-zinc-50/60 dark:border-zinc-700 dark:bg-zinc-900/60"
      onSubmit={(e) => {
        e.preventDefault();
        if (puedeGuardar) onGuardar();
      }}
    >
      <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">{titulo}</p>
        <button type="button" onClick={onCancelar} aria-label="Cancelar" className="rounded p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100">
          <IconX className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-3 px-3 py-3">{children}</div>
      {vistaPrevia ? (
        <div className="border-t border-dashed border-zinc-200 px-3 py-2 dark:border-zinc-800">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Así quedará en la etiqueta</p>
          <div className="rounded border border-zinc-300 bg-[#fbfaf6] px-2.5 py-2 text-[11px] leading-snug text-zinc-900 dark:border-zinc-600">
            {vistaPrevia}
          </div>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-2 border-t border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <p className="text-[10px] text-zinc-400">Al guardar queda aprobado con tu firma.</p>
        <div className="flex gap-2">
          <button type="button" onClick={onCancelar} className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!puedeGuardar}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-30 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Guardar
          </button>
        </div>
      </div>
    </form>
  );
}

function Chips({ opciones, onElegir }: { opciones: string[]; onElegir: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {opciones.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onElegir(o)}
          className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[11px] text-zinc-600 transition hover:border-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-500"
        >
          + {o}
        </button>
      ))}
    </div>
  );
}

const valorDe = (item: EstadoItem, etiqueta: string) => item.datos.find((d) => d.etiqueta === etiqueta)?.valor ?? "";
const num = (s: string) => s.replace(",", ".").replace(/[^\d.]/g, "");
const fmt = (s: string) => s.replace(".", ",");

/* ------------------------------------------------------------------ */
/* Nombre                                                               */
/* ------------------------------------------------------------------ */

function EditorNombre({ item, onGuardar, onCancelar }: Props) {
  const [comercial, setComercial] = useState(valorDe(item, "Nombre comercial"));
  const [legal, setLegal] = useState(valorDe(item, "Denominación legal"));
  return (
    <Marco
      titulo="Nombre del producto"
      onGuardar={() =>
        onGuardar({
          datos: [
            { etiqueta: "Nombre comercial", valor: comercial.trim() },
            ...(legal.trim() ? [{ etiqueta: "Denominación legal", valor: legal.trim() }] : []),
          ],
        })
      }
      onCancelar={onCancelar}
      puedeGuardar={comercial.trim().length > 0}
      vistaPrevia={
        <>
          <p className="text-[13px] font-bold">{comercial || "Nombre comercial"}</p>
          <p className="italic">{legal || <span className="text-zinc-400">Denominación legal</span>}</p>
        </>
      }
    >
      <Campo label="Nombre comercial" hint="Marca o nombre de fantasía. Es lo que ve el consumidor en grande.">
        <input autoFocus value={comercial} onChange={(e) => setComercial(e.target.value)} className={inputCls} placeholder="Mermelada artesanal de fresa" />
      </Campo>
      <Campo label="Denominación legal" hint="La que fija la norma del producto (RD 670/1990: «confitura extra»). Debe ir cerca del nombre comercial.">
        <input value={legal} onChange={(e) => setLegal(e.target.value)} className={inputCls} placeholder="Confitura extra de fresa" />
      </Campo>
      <Chips
        opciones={["Confitura extra de fresa", "Confitura de fresa", "Mermelada de fresa", "Preparado de fruta"]}
        onElegir={setLegal}
      />
    </Marco>
  );
}

/* ------------------------------------------------------------------ */
/* Ingredientes                                                         */
/* ------------------------------------------------------------------ */

type Ing = { id: string; nombre: string; porcentaje: string; alergeno: boolean };

function parsearIngredientes(item: EstadoItem): Ing[] {
  const est = item.estructura?.ingredientes as Ing[] | undefined;
  if (est?.length) return est;
  const texto = valorDe(item, "Ingredientes");
  if (!texto) return [{ id: "i1", nombre: "", porcentaje: "", alergeno: false }];
  return texto.split(/,\s*(?![^()]*\))/).map((t, i) => {
    const m = t.match(/^(.*?)\s*\((\d+[.,]?\d*)\s*%\)\s*$/);
    const nombre = (m ? m[1] : t).trim();
    return { id: `i${i}`, nombre, porcentaje: m ? m[2] : "", alergeno: nombre === nombre.toUpperCase() && /[A-ZÁÉÍÓÚ]/.test(nombre) };
  });
}

function textoIngredientes(lista: Ing[]): string {
  return lista
    .filter((i) => i.nombre.trim())
    .map((i) => {
      const n = i.alergeno ? i.nombre.trim().toUpperCase() : i.nombre.trim();
      return i.porcentaje ? `${n} (${fmt(i.porcentaje)} %)` : n;
    })
    .join(", ");
}

function EditorIngredientes({ item, onGuardar, onCancelar }: Props) {
  const [lista, setLista] = useState<Ing[]>(() => parsearIngredientes(item));
  const set = (id: string, patch: Partial<Ing>) => setLista((l) => l.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const mover = (idx: number, dir: -1 | 1) =>
    setLista((l) => {
      const n = [...l];
      const j = idx + dir;
      if (j < 0 || j >= n.length) return l;
      [n[idx], n[j]] = [n[j], n[idx]];
      return n;
    });
  const desordenado = useMemo(() => {
    const p = lista.map((i) => parseFloat(num(i.porcentaje))).filter((x) => !Number.isNaN(x));
    return p.some((x, i) => i > 0 && x > p[i - 1]);
  }, [lista]);
  const texto = textoIngredientes(lista);

  return (
    <Marco
      titulo="Ingredientes y cantidades"
      onGuardar={() =>
        onGuardar({
          datos: [{ etiqueta: "Ingredientes", valor: texto }],
          estructura: { ingredientes: lista.filter((i) => i.nombre.trim()) },
        })
      }
      onCancelar={onCancelar}
      puedeGuardar={texto.length > 0}
      vistaPrevia={
        <p>
          <b>Ingredientes:</b> {texto || <span className="text-zinc-400">…</span>}
        </p>
      }
    >
      <p className="text-[11px] text-zinc-500">
        En orden decreciente de peso. Marca como alérgeno los del Anexo II para destacarlos en la etiqueta. El porcentaje solo es obligatorio en los ingredientes destacados (QUID).
      </p>
      <ul className="space-y-1.5">
        {lista.map((ing, idx) => (
          <li key={ing.id} className="grid grid-cols-[auto_1fr_4rem_auto_auto] items-center gap-1.5">
            <span className="w-4 text-right text-[10px] tabular-nums text-zinc-400">{idx + 1}</span>
            <input
              value={ing.nombre}
              onChange={(e) => set(ing.id, { nombre: e.target.value })}
              placeholder="Ingrediente"
              className={inputCls}
              autoFocus={idx === 0 && !ing.nombre}
            />
            <input
              value={ing.porcentaje}
              onChange={(e) => set(ing.id, { porcentaje: e.target.value })}
              placeholder="%"
              inputMode="decimal"
              className={`${inputCls} text-right`}
            />
            <button
              type="button"
              onClick={() => set(ing.id, { alergeno: !ing.alergeno })}
              title="Alérgeno (se destaca en la etiqueta)"
              aria-pressed={ing.alergeno}
              className={`rounded-md px-1.5 py-1 text-[10px] font-bold transition ${
                ing.alergeno ? "bg-rose-600 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              A
            </button>
            <span className="flex">
              <button type="button" onClick={() => mover(idx, -1)} disabled={idx === 0} aria-label="Subir" className="rounded p-1 text-zinc-400 hover:text-zinc-800 disabled:opacity-30 dark:hover:text-zinc-100">
                <IconChevron className="h-3 w-3 rotate-180" />
              </button>
              <button type="button" onClick={() => mover(idx, 1)} disabled={idx === lista.length - 1} aria-label="Bajar" className="rounded p-1 text-zinc-400 hover:text-zinc-800 disabled:opacity-30 dark:hover:text-zinc-100">
                <IconChevron className="h-3 w-3" />
              </button>
              <button type="button" onClick={() => setLista((l) => (l.length > 1 ? l.filter((x) => x.id !== ing.id) : l))} aria-label="Quitar" className="rounded p-1 text-zinc-400 hover:text-rose-600">
                <IconX className="h-3 w-3" />
              </button>
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setLista((l) => [...l, { id: `i${Date.now()}`, nombre: "", porcentaje: "", alergeno: false }])}
          className="text-xs font-medium text-zinc-800 underline-offset-2 hover:underline dark:text-zinc-100"
        >
          + Añadir ingrediente
        </button>
        {desordenado ? (
          <button
            type="button"
            onClick={() => setLista((l) => [...l].sort((a, b) => (parseFloat(num(b.porcentaje)) || 0) - (parseFloat(num(a.porcentaje)) || 0)))}
            className="rounded-md bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-200"
          >
            El orden no es decreciente · Ordenar por %
          </button>
        ) : null}
      </div>
    </Marco>
  );
}

/* ------------------------------------------------------------------ */
/* Alérgenos                                                            */
/* ------------------------------------------------------------------ */

function EditorAlergenos({ item, onGuardar, onCancelar }: Props) {
  const est = item.estructura as { contiene?: string[]; trazas?: string[] } | undefined;
  const desdeTexto = (t: string) => ALERGENOS_UE.filter((a) => t.toLowerCase().includes(a.split(" ")[0].toLowerCase()));
  const [contiene, setContiene] = useState<string[]>(est?.contiene ?? desdeTexto(valorDe(item, "Contiene")));
  const [trazas, setTrazas] = useState<string[]>(est?.trazas ?? desdeTexto(valorDe(item, "Puede contener")));
  const toggle = (lista: string[], set: (v: string[]) => void, a: string) =>
    set(lista.includes(a) ? lista.filter((x) => x !== a) : [...lista, a]);

  return (
    <Marco
      titulo="Alérgenos y trazas"
      onGuardar={() =>
        onGuardar({
          datos: [
            { etiqueta: "Contiene", valor: contiene.length ? contiene.join(", ") : "Ninguno de los 14 alérgenos" },
            ...(trazas.length ? [{ etiqueta: "Puede contener", valor: trazas.join(", ") }] : []),
          ],
          estructura: { contiene, trazas },
        })
      }
      onCancelar={onCancelar}
      vistaPrevia={
        <>
          {contiene.length ? <p>Los alérgenos se destacan en la lista de ingredientes: <b>{contiene.join(", ").toUpperCase()}</b>.</p> : <p className="text-zinc-500">Sin alérgenos declarados.</p>}
          {trazas.length ? <p>Puede contener {trazas.join(", ").toLowerCase()}.</p> : null}
        </>
      }
    >
      <p className="text-[11px] text-zinc-500">Los 14 alérgenos del Anexo II. «Contiene» va destacado en los ingredientes; «Trazas» genera la mención «puede contener».</p>
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {ALERGENOS_UE.map((a) => (
          <li key={a} className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-800 dark:bg-zinc-950">
            <span className="truncate text-[11px] text-zinc-700 dark:text-zinc-200">{a}</span>
            <span className="flex gap-1">
              <button type="button" onClick={() => toggle(contiene, setContiene, a)} aria-pressed={contiene.includes(a)} className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${contiene.includes(a) ? "bg-rose-600 text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"}`}>
                Contiene
              </button>
              <button type="button" onClick={() => toggle(trazas, setTrazas, a)} aria-pressed={trazas.includes(a)} className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${trazas.includes(a) ? "bg-amber-500 text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"}`}>
                Trazas
              </button>
            </span>
          </li>
        ))}
      </ul>
    </Marco>
  );
}

/* ------------------------------------------------------------------ */
/* Nutricional                                                          */
/* ------------------------------------------------------------------ */

const NUTRIENTES: { clave: string; etiqueta: string; unidad: string; sangria?: boolean }[] = [
  { clave: "kj", etiqueta: "Valor energético (kJ)", unidad: "kJ" },
  { clave: "kcal", etiqueta: "Valor energético (kcal)", unidad: "kcal" },
  { clave: "grasas", etiqueta: "Grasas", unidad: "g" },
  { clave: "saturadas", etiqueta: "de las cuales saturadas", unidad: "g", sangria: true },
  { clave: "hidratos", etiqueta: "Hidratos de carbono", unidad: "g" },
  { clave: "azucares", etiqueta: "de los cuales azúcares", unidad: "g", sangria: true },
  { clave: "fibra", etiqueta: "Fibra alimentaria", unidad: "g" },
  { clave: "proteinas", etiqueta: "Proteínas", unidad: "g" },
  { clave: "sal", etiqueta: "Sal", unidad: "g" },
];

function parsearNutri(item: EstadoItem): Record<string, string> {
  const est = item.estructura?.nutricional as Record<string, string> | undefined;
  if (est) return est;
  const v: Record<string, string> = {};
  const energia = valorDe(item, "Valor energético");
  const m = energia.match(/([\d.,]+)\s*kJ\s*\/\s*([\d.,]+)\s*kcal/i);
  if (m) {
    v.kj = m[1];
    v.kcal = m[2];
  }
  for (const n of NUTRIENTES) {
    const d = item.datos.find((x) => x.etiqueta.toLowerCase() === n.etiqueta.toLowerCase());
    if (d) v[n.clave] = d.valor.replace(/\s*g$/, "");
  }
  return v;
}

function EditorNutricional({ item, onGuardar, onCancelar }: Props) {
  const [v, setV] = useState<Record<string, string>>(() => parsearNutri(item));
  const set = (k: string, val: string) => setV((x) => ({ ...x, [k]: val }));
  const kcalDesdeKj = () => {
    const kj = parseFloat(num(v.kj ?? ""));
    if (!Number.isNaN(kj)) set("kcal", String(Math.round(kj / 4.184)));
  };
  const completo = ["kj", "kcal", "grasas", "saturadas", "hidratos", "azucares", "proteinas", "sal"].every((k) => (v[k] ?? "").trim());

  return (
    <Marco
      titulo="Tabla nutricional (por 100 g)"
      onGuardar={() =>
        onGuardar({
          datos: [
            { etiqueta: "Valor energético", valor: `${fmt(v.kj)} kJ / ${fmt(v.kcal)} kcal` },
            ...NUTRIENTES.filter((n) => n.unidad === "g" && (v[n.clave] ?? "").trim()).map((n) => ({ etiqueta: n.etiqueta, valor: `${fmt(v[n.clave])} g` })),
          ],
          estructura: { nutricional: v },
        })
      }
      onCancelar={onCancelar}
      puedeGuardar={completo}
      vistaPrevia={
        <table className="w-full text-[10px]">
          <tbody>
            <tr><td>Valor energético</td><td className="text-right tabular-nums">{fmt(v.kj || "…")} kJ / {fmt(v.kcal || "…")} kcal</td></tr>
            {NUTRIENTES.filter((n) => n.unidad === "g").map((n) => (
              <tr key={n.clave}><td className={n.sangria ? "pl-3" : ""}>{n.etiqueta}</td><td className="text-right tabular-nums">{v[n.clave] ? `${fmt(v[n.clave])} g` : "…"}</td></tr>
            ))}
          </tbody>
        </table>
      }
    >
      <p className="text-[11px] text-zinc-500">Orden y nombres fijados por el Anexo XV. La fibra es opcional; el resto es obligatorio. Usa coma decimal.</p>
      <div className="space-y-1">
        {NUTRIENTES.map((n) => (
          <div key={n.clave} className={`grid grid-cols-[1fr_6rem_2.5rem] items-center gap-2 ${n.sangria ? "pl-4" : ""}`}>
            <label htmlFor={`nut-${n.clave}`} className="text-[11px] text-zinc-700 dark:text-zinc-200">{n.etiqueta}</label>
            <input id={`nut-${n.clave}`} value={v[n.clave] ?? ""} onChange={(e) => set(n.clave, e.target.value)} inputMode="decimal" className={`${inputCls} text-right`} />
            <span className="text-[11px] text-zinc-400">{n.unidad}</span>
          </div>
        ))}
      </div>
      <button type="button" onClick={kcalDesdeKj} className="text-[11px] text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-300">
        Calcular kcal a partir de kJ (÷ 4,184)
      </button>
    </Marco>
  );
}

/* ------------------------------------------------------------------ */
/* Cantidad neta                                                        */
/* ------------------------------------------------------------------ */

function EditorCantidad({ item, onGuardar, onCancelar }: Props) {
  const actual = valorDe(item, "Cantidad neta");
  const m = actual.match(/([\d.,]+)\s*(g|kg|ml|l|cl)/i);
  const [valor, setValor] = useState(m ? m[1] : "");
  const [unidad, setUnidad] = useState(m ? m[2].toLowerCase() : "g");
  const [estimado, setEstimado] = useState(true);
  const texto = valor ? `${fmt(valor)} ${unidad}${estimado ? " ℮" : ""}` : "";
  return (
    <Marco
      titulo="Cantidad neta"
      onGuardar={() => onGuardar({ datos: [{ etiqueta: "Cantidad neta", valor: `${fmt(valor)} ${unidad}` }, { etiqueta: "Símbolo ℮", valor: estimado ? "Sí" : "No" }] })}
      onCancelar={onCancelar}
      puedeGuardar={valor.trim().length > 0}
      vistaPrevia={<p className="text-[14px] font-bold">{texto || "…"}</p>}
    >
      <div className="grid grid-cols-[1fr_6rem] gap-2">
        <Campo label="Cantidad">
          <input autoFocus value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" className={inputCls} placeholder="250" />
        </Campo>
        <Campo label="Unidad">
          <select value={unidad} onChange={(e) => setUnidad(e.target.value)} className={inputCls}>
            {["g", "kg", "ml", "cl", "l"].map((u) => <option key={u}>{u}</option>)}
          </select>
        </Campo>
      </div>
      <label className="flex items-start gap-2 text-[11px] text-zinc-600 dark:text-zinc-300">
        <input type="checkbox" checked={estimado} onChange={(e) => setEstimado(e.target.checked)} className="mt-0.5 h-3.5 w-3.5 accent-zinc-900" />
        <span>Incluir el símbolo ℮ (contenido estimado según la Directiva 76/211/CEE). Solo si el envasador controla el llenado.</span>
      </label>
      <p className="text-[11px] text-zinc-400">Altura mínima de los caracteres: 2 mm hasta 50 g, 3 mm hasta 200 g, 4 mm hasta 1 kg, 6 mm por encima.</p>
    </Marco>
  );
}

/* ------------------------------------------------------------------ */
/* Lote                                                                 */
/* ------------------------------------------------------------------ */

function EditorLote({ item, onGuardar, onCancelar }: Props) {
  const [lote, setLote] = useState(valorDe(item, "Lote"));
  const limpio = lote.trim().toUpperCase().replace(/\s+/g, "");
  const conL = /^L/.test(limpio);
  return (
    <Marco
      titulo="Lote"
      onGuardar={() => onGuardar({ datos: [{ etiqueta: "Lote", valor: limpio }] })}
      onCancelar={onCancelar}
      puedeGuardar={limpio.length >= 2}
      vistaPrevia={<p>Lote: {limpio || "…"}</p>}
    >
      <Campo
        label="Identificación del lote"
        hint={conL ? "Correcto: precedido de la letra L." : "Debe ir precedido de la letra L salvo que se distinga claramente del resto (RD 2207/1995)."}
      >
        <input autoFocus value={lote} onChange={(e) => setLote(e.target.value)} className={inputCls} placeholder="L2026-014" />
      </Campo>
      <Chips opciones={["L2026-014", "L + fecha de envasado (LAAMMDD)"]} onElegir={(o) => setLote(o.startsWith("L +") ? "L260915" : o)} />
    </Marco>
  );
}

/* ------------------------------------------------------------------ */
/* Fecha                                                                */
/* ------------------------------------------------------------------ */

const TIPOS_FECHA = [
  { id: "cp_dia", texto: "Consumir preferentemente antes del", ayuda: "Duración inferior a 3 meses: día y mes." },
  { id: "cp_fin", texto: "Consumir preferentemente antes del fin de", ayuda: "Entre 3 y 18 meses: mes y año. Más de 18 meses: basta el año." },
  { id: "cad", texto: "Fecha de caducidad", ayuda: "Solo para productos muy perecederos (microbiológicamente). Día y mes obligatorios." },
];
const UBICACIONES = ["ver tapa", "ver base del envase", "ver lateral", "ver marcado junto al lote"];

function EditorFecha({ item, onGuardar, onCancelar, requisito }: Props) {
  const actual = valorDe(item, "Mención propuesta");
  const [tipo, setTipo] = useState(actual.startsWith("Fecha de caducidad") ? "cad" : actual.includes("fin de") ? "cp_fin" : requisito.titulo.includes("caducidad") ? "cad" : "cp_fin");
  const [ubicacion, setUbicacion] = useState(UBICACIONES.find((u) => actual.toLowerCase().includes(u)) ?? "ver tapa");
  const [meses, setMeses] = useState(valorDe(item, "Base").match(/\d+/)?.[0] ?? "");
  const t = TIPOS_FECHA.find((x) => x.id === tipo)!;
  const mencion = `${t.texto}: ${ubicacion}`;
  return (
    <Marco
      titulo={requisito.titulo}
      onGuardar={() =>
        onGuardar({
          datos: [
            { etiqueta: "Mención propuesta", valor: mencion },
            ...(meses ? [{ etiqueta: "Base", valor: `${meses} meses según estudio de vida útil` }] : []),
          ],
        })
      }
      onCancelar={onCancelar}
      vistaPrevia={<p>{mencion}</p>}
    >
      <Campo label="Tipo de fecha" hint={t.ayuda}>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputCls}>
          {TIPOS_FECHA.map((x) => <option key={x.id} value={x.id}>{x.texto}</option>)}
        </select>
      </Campo>
      <Campo label="Dónde está impresa la fecha" hint="Si no va junto a la mención, hay que indicar dónde encontrarla.">
        <select value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} className={inputCls}>
          {UBICACIONES.map((u) => <option key={u}>{u}</option>)}
        </select>
      </Campo>
      <Campo label="Vida útil (meses)" hint="Lo justifica el estudio de vida útil.">
        <input value={meses} onChange={(e) => setMeses(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={inputCls} placeholder="24" />
      </Campo>
    </Marco>
  );
}

/* ------------------------------------------------------------------ */
/* Responsable                                                          */
/* ------------------------------------------------------------------ */

function EditorResponsable({ item, onGuardar, onCancelar }: Props) {
  const est = item.estructura as Record<string, string> | undefined;
  const dir = valorDe(item, "Dirección");
  const partes = dir.split("·").map((s) => s.trim());
  const cpLoc = (partes[1] ?? "").match(/^(\d{5})\s+(.*)$/);
  const [f, setF] = useState({
    razon: est?.razon ?? valorDe(item, "Responsable"),
    direccion: est?.direccion ?? partes[0] ?? "",
    cp: est?.cp ?? cpLoc?.[1] ?? "",
    localidad: est?.localidad ?? cpLoc?.[2] ?? partes[1] ?? "",
    pais: est?.pais ?? partes[2] ?? "España",
  });
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  const direccion = [f.direccion, [f.cp, f.localidad].filter(Boolean).join(" "), f.pais].filter(Boolean).join(" · ");
  return (
    <Marco
      titulo="Empresa responsable"
      onGuardar={() => onGuardar({ datos: [{ etiqueta: "Responsable", valor: f.razon.trim() }, { etiqueta: "Dirección", valor: direccion }], estructura: f })}
      onCancelar={onCancelar}
      puedeGuardar={Boolean(f.razon.trim() && f.direccion.trim() && f.localidad.trim())}
      vistaPrevia={<p>{f.razon || "Razón social"} · {direccion}</p>}
    >
      <Campo label="Razón social" hint="Operador responsable de la información alimentaria: envasador o vendedor establecido en la UE.">
        <input autoFocus value={f.razon} onChange={(e) => set("razon", e.target.value)} className={inputCls} />
      </Campo>
      <Campo label="Dirección">
        <input value={f.direccion} onChange={(e) => set("direccion", e.target.value)} className={inputCls} placeholder="Pol. Ind. La Vega, 11" />
      </Campo>
      <div className="grid grid-cols-[6rem_1fr] gap-2">
        <Campo label="C. P.">
          <input value={f.cp} onChange={(e) => set("cp", e.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" className={inputCls} />
        </Campo>
        <Campo label="Localidad (provincia)">
          <input value={f.localidad} onChange={(e) => set("localidad", e.target.value)} className={inputCls} placeholder="Estepa (Sevilla)" />
        </Campo>
      </div>
      <Campo label="País">
        <input value={f.pais} onChange={(e) => set("pais", e.target.value)} className={inputCls} />
      </Campo>
    </Marco>
  );
}

/* ------------------------------------------------------------------ */
/* RGSEAA y EAN                                                         */
/* ------------------------------------------------------------------ */

function EditorRegistro({ item, onGuardar, onCancelar }: Props) {
  const [v, setV] = useState(valorDe(item, "Nº RGSEAA"));
  const limpio = v.trim().toUpperCase().replace(/^RGSEAA\s*/, "");
  const valido = /^\d{2}\.\d{4,6}\/[A-Z]{1,3}$/.test(limpio);
  return (
    <Marco
      titulo="Registro sanitario (RGSEAA)"
      onGuardar={() => onGuardar({ datos: [{ etiqueta: "Nº RGSEAA", valor: limpio }] })}
      onCancelar={onCancelar}
      puedeGuardar={valido}
      vistaPrevia={<p>RGSEAA {limpio || "…"}</p>}
    >
      <Campo
        label="Número de registro"
        hint="Formato: clave de actividad (2 cifras) . número / provincia. Ejemplo: 21.012345/SE."
        error={v && !valido ? "El formato no coincide con NN.NNNNNN/XX." : undefined}
      >
        <input autoFocus value={v} onChange={(e) => setV(e.target.value)} className={inputCls} placeholder="21.012345/SE" />
      </Campo>
      <p className="text-[11px] text-zinc-400">Clave 21 = productos vegetales y derivados. Se comprueba en el buscador de la AESAN.</p>
    </Marco>
  );
}

function eanValido(s: string): boolean {
  if (!/^\d{13}$/.test(s)) return false;
  const d = s.split("").map(Number);
  const suma = d.slice(0, 12).reduce((acc, x, i) => acc + x * (i % 2 === 0 ? 1 : 3), 0);
  return (10 - (suma % 10)) % 10 === d[12];
}

function EditorEan({ item, onGuardar, onCancelar }: Props) {
  const [v, setV] = useState(valorDe(item, "EAN-13"));
  const limpio = v.replace(/\D/g, "");
  const valido = eanValido(limpio);
  return (
    <Marco
      titulo="Código EAN-13"
      onGuardar={() => onGuardar({ datos: [{ etiqueta: "EAN-13", valor: limpio }] })}
      onCancelar={onCancelar}
      puedeGuardar={valido}
      vistaPrevia={<p className="tracking-widest tabular-nums">{limpio || "…"}</p>}
    >
      <Campo
        label="Código de barras"
        hint="13 dígitos. El prefijo 84 corresponde a empresas registradas en AECOC (España)."
        error={limpio.length === 13 && !valido ? "El dígito de control no cuadra. Revisa el código." : limpio && limpio.length !== 13 ? `${limpio.length}/13 dígitos` : undefined}
      >
        <input autoFocus value={v} onChange={(e) => setV(e.target.value)} inputMode="numeric" className={`${inputCls} tracking-widest`} placeholder="8412345678905" />
      </Campo>
    </Marco>
  );
}

/* ------------------------------------------------------------------ */
/* Textos con sugerencias                                               */
/* ------------------------------------------------------------------ */

const SUGERENCIAS: Record<string, string[]> = {
  conservacion: ["Conservar en lugar fresco y seco.", "Una vez abierto, mantener refrigerado.", "Consumir en 4 semanas tras la apertura.", "Conservar entre 0 y 4 °C.", "Proteger de la luz directa."],
  transporte: ["Temperatura ambiente, protegido de la luz.", "Transporte refrigerado entre 0 y 4 °C.", "No apilar más de 7 alturas."],
  modo_empleo: ["Listo para consumir.", "Agitar antes de usar.", "Calentar 2 minutos al microondas a 800 W.", "Diluir una parte en tres de agua."],
  paletizado: ["12 unidades por caja.", "84 cajas por palé (europalé, 7 alturas).", "Caja de cartón 30 × 20 × 12 cm."],
  tipo_envase: ["Tarro de vidrio con tapa twist-off.", "Bolsa flexible termosellada.", "Lata de hojalata con abrefácil.", "Bandeja PET con film."],
};
const ETIQUETA_TEXTO: Record<string, string> = {
  conservacion: "Conservación",
  transporte: "Transporte",
  modo_empleo: "Modo de empleo",
  paletizado: "Paletizado",
  tipo_envase: "Envase",
};

function EditorTexto({ item, requisito: r, onGuardar, onCancelar }: Props) {
  const etiqueta = ETIQUETA_TEXTO[r.id] ?? r.titulo;
  const [v, setV] = useState(item.datos[0]?.valor ?? "");
  return (
    <Marco
      titulo={r.titulo}
      onGuardar={() => onGuardar({ datos: [{ etiqueta, valor: v.trim() }] })}
      onCancelar={onCancelar}
      puedeGuardar={v.trim().length > 0}
      vistaPrevia={<p>{v || "…"}</p>}
    >
      <Campo label="Texto" hint="Frases cortas, en infinitivo o imperativo, tal y como irán impresas.">
        <textarea autoFocus value={v} onChange={(e) => setV(e.target.value)} rows={3} className={`${inputCls} resize-y`} />
      </Campo>
      {SUGERENCIAS[r.id] ? <Chips opciones={SUGERENCIAS[r.id]} onElegir={(o) => setV((x) => (x.trim() ? `${x.trim()} ${o}` : o))} /> : null}
    </Marco>
  );
}

/* ------------------------------------------------------------------ */
/* Declaraciones (redacción exacta)                                     */
/* ------------------------------------------------------------------ */

const REDACCIONES: Record<string, string[]> = {
  aviso_sulfitos: ["Contiene sulfitos", "Contiene dióxido de azufre y sulfitos"],
  artesano_justificado: ["Producto artesano", "Elaboración artesanal", "Artesanía alimentaria · Reg. AA-SE-0417"],
  con_edulcorantes: ["Con edulcorantes", "Con azúcares y edulcorantes"],
  aviso_cafeina: ["Contenido elevado de cafeína: no recomendado para niños ni mujeres embarazadas o en periodo de lactancia"],
  contiene_fenilalanina: ["Contiene una fuente de fenilalanina"],
  aviso_polialcoholes: ["Un consumo excesivo puede producir efectos laxantes"],
  ultracongelado: ["Ultracongelado", "No volver a congelar una vez descongelado"],
  descongelado: ["Descongelado"],
  eco_eurohoja: ["Logo eurohoja + código del organismo de control", "Agricultura UE"],
  vegano_sello: ["V-Label", "Apto para veganos"],
  sin_gluten_umbral: ["Sin gluten", "Espiga barrada (FACE)"],
  halal_sin_porcino: ["Halal · Instituto Halal"],
};

function EditorDeclaracion({ item, requisito: r, onGuardar, onCancelar }: Props) {
  const opciones = REDACCIONES[r.id] ?? [];
  const actual = valorDe(item, "Mención") || valorDe(item, "Declaración");
  const [eleccion, setEleccion] = useState(actual || opciones[0] || "");
  const [personal, setPersonal] = useState(actual && !opciones.includes(actual) ? actual : "");
  const texto = personal.trim() || eleccion;
  return (
    <Marco
      titulo={r.titulo}
      onGuardar={() => onGuardar({ datos: [{ etiqueta: "Mención", valor: texto }] })}
      onCancelar={onCancelar}
      puedeGuardar={texto.trim().length > 0}
      vistaPrevia={<p className="font-semibold">{texto || "…"}</p>}
    >
      {opciones.length ? (
        <div>
          <p className="mb-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">Redacción</p>
          <ul className="space-y-1">
            {opciones.map((o) => (
              <li key={o}>
                <label className="flex cursor-pointer items-start gap-2 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[11px] text-zinc-800 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                  <input type="radio" name="redaccion" checked={!personal.trim() && eleccion === o} onChange={() => { setEleccion(o); setPersonal(""); }} className="mt-0.5 accent-zinc-900" />
                  {o}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Campo label={opciones.length ? "U otra redacción" : "Redacción exacta"} hint={r.baseLegal ? `Base legal: ${r.baseLegal}` : undefined}>
        <input value={personal} onChange={(e) => setPersonal(e.target.value)} className={inputCls} placeholder="Texto tal y como irá en la etiqueta" />
      </Campo>
    </Marco>
  );
}

/* ------------------------------------------------------------------ */
/* Clave / valor (laboratorio y genéricos)                              */
/* ------------------------------------------------------------------ */

function EditorClaveValor({ item, requisito: r, onGuardar, onCancelar }: Props) {
  const inicial = item.datos.length
    ? item.datos
    : (r.parametros ?? []).slice(0, 6).map((p) => ({ etiqueta: p, valor: "" }));
  const [filas, setFilas] = useState<Dato[]>(inicial.length ? inicial : [{ etiqueta: "", valor: "" }]);
  const set = (i: number, patch: Partial<Dato>) => setFilas((f) => f.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const validas = filas.filter((f) => f.etiqueta.trim() && f.valor.trim());
  return (
    <Marco
      titulo={r.titulo}
      onGuardar={() => onGuardar({ datos: validas })}
      onCancelar={onCancelar}
      puedeGuardar={validas.length > 0}
    >
      <p className="text-[11px] text-zinc-500">
        {r.parametros?.length
          ? "Parámetros que debe traer el informe y el valor que figura en él. Si el asistente los leyó mal, corrígelos aquí."
          : "Pares de dato y valor tal y como se usarán."}
      </p>
      <ul className="space-y-1.5">
        {filas.map((f, i) => (
          <li key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-1.5">
            <input value={f.etiqueta} onChange={(e) => set(i, { etiqueta: e.target.value })} placeholder="Parámetro" className={inputCls} list={`params-${r.id}`} />
            <input value={f.valor} onChange={(e) => set(i, { valor: e.target.value })} placeholder="Valor" className={inputCls} />
            <button type="button" onClick={() => setFilas((x) => (x.length > 1 ? x.filter((_, j) => j !== i) : x))} aria-label="Quitar" className="rounded p-1 text-zinc-400 hover:text-rose-600">
              <IconX className="h-3 w-3" />
            </button>
          </li>
        ))}
      </ul>
      {r.parametros?.length ? (
        <datalist id={`params-${r.id}`}>
          {r.parametros.map((p) => <option key={p} value={p} />)}
        </datalist>
      ) : null}
      <button type="button" onClick={() => setFilas((f) => [...f, { etiqueta: "", valor: "" }])} className="text-xs font-medium text-zinc-800 underline-offset-2 hover:underline dark:text-zinc-100">
        + Añadir fila
      </button>
    </Marco>
  );
}
