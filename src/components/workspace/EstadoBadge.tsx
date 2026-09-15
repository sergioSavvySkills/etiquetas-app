import type { EstadoRequisito } from "@/lib/workspace";
import { ESTADOS } from "@/lib/workspace";
import {
  IconAlert,
  IconBan,
  IconCheck,
  IconClock,
  IconFile,
  IconLoader,
} from "@/components/workspace/icons";

const ESTILO: Record<
  EstadoRequisito,
  { icono: string; chip: string; punto: string }
> = {
  pendiente: {
    icono: "border-zinc-300 text-zinc-400 dark:border-zinc-600 dark:text-zinc-500",
    chip: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    punto: "bg-zinc-300 dark:bg-zinc-600",
  },
  recibido: {
    icono: "border-sky-300 bg-sky-50 text-sky-600 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300",
    chip: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    punto: "bg-sky-400",
  },
  analizando: {
    icono: "border-violet-300 bg-violet-50 text-violet-600 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300",
    chip: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    punto: "bg-violet-400",
  },
  verificado: {
    icono: "border-emerald-500 bg-emerald-500 text-white dark:border-emerald-500",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    punto: "bg-emerald-500",
  },
  incidencia: {
    icono: "border-amber-400 bg-amber-50 text-amber-600 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300",
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    punto: "bg-amber-400",
  },
  no_aplica: {
    icono: "border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500",
    chip: "bg-zinc-100 text-zinc-500 line-through decoration-zinc-400 dark:bg-zinc-800 dark:text-zinc-400",
    punto: "bg-zinc-200 dark:bg-zinc-700",
  },
};

function Icono({ estado }: { estado: EstadoRequisito }) {
  const cls = "h-3 w-3";
  switch (estado) {
    case "verificado":
      return <IconCheck className={cls} strokeWidth={3} />;
    case "incidencia":
      return <IconAlert className={cls} />;
    case "no_aplica":
      return <IconBan className={cls} />;
    case "analizando":
      return <IconLoader className={cls} />;
    case "recibido":
      return <IconFile className={cls} />;
    default:
      return <IconClock className={cls} />;
  }
}

/** Círculo de estado para la lista de requisitos. */
export function EstadoIcono({ estado }: { estado: EstadoRequisito }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${ESTILO[estado].icono}`}
      title={ESTADOS[estado].nombre}
    >
      <Icono estado={estado} />
    </span>
  );
}

/** Chip con texto para cabeceras y detalle. */
export function EstadoChip({ estado }: { estado: EstadoRequisito }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${ESTILO[estado].chip}`}
    >
      <Icono estado={estado} />
      {ESTADOS[estado].nombre}
    </span>
  );
}

export function EstadoPunto({ estado }: { estado: EstadoRequisito }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${ESTILO[estado].punto}`} />;
}
