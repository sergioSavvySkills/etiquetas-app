export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <span className="rounded-full border border-black/10 px-3 py-1 text-sm font-medium text-zinc-600 dark:border-white/15 dark:text-zinc-400">
          Next.js · Vercel · Xano
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50 sm:text-5xl">
          Etiquetas App
        </h1>
        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Proyecto inicial listo. El frontend corre en Next.js y se desplegará
          en Vercel. El backend y la base de datos se gestionan en Xano.
        </p>
      </main>
    </div>
  );
}
