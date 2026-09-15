import Wizard from "@/components/wizard/Wizard";

/** Versión anterior de la app (asistente paso a paso). Se conserva como referencia. */
export default function WizardPage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <Wizard />
    </div>
  );
}
