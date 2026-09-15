import Workspace from "@/components/workspace/Workspace";
import { esEscenario, type EscenarioId } from "@/lib/escenarios";

/**
 * Espacio de trabajo. `?escenario=vacio|en_curso|completo` carga la maqueta
 * en distintos momentos del proceso (solo para la demo).
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { escenario } = await searchParams;
  const id: EscenarioId = esEscenario(escenario) ? escenario : "en_curso";
  return <Workspace key={id} escenario={id} />;
}
