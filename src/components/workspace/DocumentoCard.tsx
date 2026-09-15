import type { Documento } from "@/lib/workspace";
import { formatearTamano } from "@/lib/workspace";
import { IconAlert, IconFile, IconImage, IconSheet } from "@/components/workspace/icons";

export function IconoDocumento({ tipo, className }: { tipo: Documento["tipo"]; className?: string }) {
  const cls = className ?? "h-4 w-4";
  if (tipo === "imagen") return <IconImage className={cls} />;
  if (tipo === "hoja") return <IconSheet className={cls} />;
  return <IconFile className={cls} />;
}

const COLOR: Record<Documento["tipo"], string> = {
  pdf: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
  imagen: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300",
  hoja: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
  otro: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

export default function DocumentoCard({
  doc,
  onClick,
  compacto = false,
}: {
  doc: Documento;
  onClick?: () => void;
  compacto?: boolean;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg border border-zinc-200 bg-white text-left transition dark:border-zinc-800 dark:bg-zinc-900 ${
        onClick ? "hover:border-zinc-400 dark:hover:border-zinc-600" : ""
      } ${compacto ? "px-2.5 py-1.5" : "px-3 py-2"}`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${COLOR[doc.tipo]}`}>
        <IconoDocumento tipo={doc.tipo} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-zinc-800 dark:text-zinc-100">
          {doc.nombre}
        </span>
        <span className="block text-[11px] text-zinc-500">
          {doc.tipo.toUpperCase()} · {formatearTamano(doc.tamano)}
          {doc.paginas ? ` · ${doc.paginas} pág.` : ""}
        </span>
      </span>
      {!doc.legible ? (
        <span title="No se ha podido leer" className="text-amber-500">
          <IconAlert className="h-4 w-4" />
        </span>
      ) : null}
    </Tag>
  );
}
