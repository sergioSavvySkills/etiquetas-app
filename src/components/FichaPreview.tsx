import type { FichaTecnica } from "@/lib/ficha";
import { getSector, getCertificacion, mencionPorId } from "@/lib/matriz";

function Dash() {
  return <span className="text-zinc-300 dark:text-zinc-600">—</span>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  const vacio =
    value === "" || value === null || value === undefined ||
    (Array.isArray(value) && value.length === 0);
  return (
    <div className="grid grid-cols-[40%_60%] gap-2 border-b border-zinc-100 py-1.5 text-xs last:border-0 dark:border-zinc-800">
      <dt className="font-medium text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-zinc-900 dark:text-zinc-100">{vacio ? <Dash /> : value}</dd>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 border-b-2 border-zinc-900 pb-1 text-[11px] font-bold uppercase tracking-wider text-zinc-900 dark:border-zinc-100 dark:text-zinc-100">
        {title}
      </h3>
      <dl>{children}</dl>
    </div>
  );
}

export default function FichaPreview({ ficha }: { ficha: FichaTecnica }) {
  const n = ficha.infoNutricional;
  const ingredientesTexto = ficha.ingredientes
    .filter((i) => i.nombre.trim())
    .map((i) => (i.porcentaje ? `${i.nombre} (${i.porcentaje}%)` : i.nombre))
    .join(", ");

  const sector = getSector(ficha.sectorId);
  const certs = ficha.certificaciones
    .map(getCertificacion)
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const extrasEntries = Object.entries(ficha.extras).filter(([, v]) =>
    v?.trim(),
  );

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
      <header className="mb-5 flex items-start justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Ficha técnica
          </p>
          <h2 className="mt-1 text-lg font-bold">
            {ficha.nombreProducto || "Producto sin nombre"}
          </h2>
          {ficha.ean ? (
            <p className="mt-0.5 font-mono text-xs text-zinc-500">EAN {ficha.ean}</p>
          ) : null}
        </div>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-center text-[9px] text-zinc-400 dark:border-zinc-700">
          {ficha.fotoProducto ? "Foto\nadjunta" : "Sin foto"}
        </div>
      </header>

      <div className="space-y-5">
        {sector || certs.length || extrasEntries.length ? (
          <Block title="Clasificación y cumplimiento">
            <Row label="Tipo de producto" value={sector?.nombre ?? ""} />
            <Row
              label="Normativa"
              value={sector ? sector.normativaBase.join(" · ") : ""}
            />
            {certs.length ? (
              <Row
                label="Certificaciones"
                value={certs.map((c) => c.nombre).join(", ")}
              />
            ) : null}
            {extrasEntries.map(([id, v]) => (
              <Row key={id} label={mencionPorId(id)?.etiquetaCorta ?? id} value={v} />
            ))}
          </Block>
        ) : null}

        <Block title="Composición">
          <Row label="Ingredientes" value={ingredientesTexto} />
        </Block>

        <Block title="Alérgenos">
          <Row
            label="Contiene"
            value={
              ficha.alergenosContiene.length ? (
                <span className="font-semibold">
                  {ficha.alergenosContiene.join(", ")}
                </span>
              ) : (
                ""
              )
            }
          />
          <Row label="Puede contener trazas" value={ficha.alergenosTrazas.join(", ")} />
        </Block>

        <Block title="Información nutricional (por 100 g/ml)">
          <Row
            label="Valor energético"
            value={
              n.energiaKcal || n.energiaKj
                ? `${n.energiaKj || "—"} kJ / ${n.energiaKcal || "—"} kcal`
                : ""
            }
          />
          <Row label="Grasas" value={n.grasas ? `${n.grasas} g` : ""} />
          <Row label="— de las cuales saturadas" value={n.grasasSaturadas ? `${n.grasasSaturadas} g` : ""} />
          <Row label="Hidratos de carbono" value={n.hidratos ? `${n.hidratos} g` : ""} />
          <Row label="— de los cuales azúcares" value={n.azucares ? `${n.azucares} g` : ""} />
          <Row label="Fibra alimentaria" value={n.fibra ? `${n.fibra} g` : ""} />
          <Row label="Proteínas" value={n.proteinas ? `${n.proteinas} g` : ""} />
          <Row label="Sal" value={n.sal ? `${n.sal} g` : ""} />
        </Block>

        <Block title="Análisis y calidad">
          <Row label="Vida útil" value={ficha.vidaUtil} />
          <Row label="Análisis microbiológico" value={ficha.analisisMicrobiologico} />
          <Row label="Análisis de laboratorio" value={ficha.analisisLaboratorio} />
          <Row label="Pasteurizado" value={ficha.pasteurizado ? "Sí" : ""} />
        </Block>

        <Block title="Conservación y uso">
          <Row label="Tipo de envase" value={ficha.tipoEnvase} />
          <Row label="Conservación" value={ficha.condicionesConservacion} />
          <Row label="Temperatura" value={ficha.temperaturaConservacion} />
          <Row label="Modo de empleo" value={ficha.modoEmpleo} />
        </Block>

        <Block title="Información legal">
          <Row label="Registro sanitario" value={ficha.registroSanitario} />
          <Row label="Fabricante" value={ficha.fabricante} />
          <Row label="Dirección" value={ficha.direccionFabricante} />
          <Row
            label="FT del proveedor"
            value={ficha.fichaTecnicaProveedor?.nombre ?? ""}
          />
        </Block>
      </div>

      <footer className="mt-5 border-t border-zinc-200 pt-3 text-[10px] text-zinc-400 dark:border-zinc-800">
        Documento generado como apoyo a la elaboración de la etiqueta. No constituye
        la etiqueta final del producto.
      </footer>
    </div>
  );
}
