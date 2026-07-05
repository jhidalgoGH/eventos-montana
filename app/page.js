export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main className="flex max-w-2xl flex-col items-center gap-6 text-center">
        <span className="text-6xl" role="img" aria-label="montaña">
          ⛰️
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Eventos de Montaña
        </h1>
        <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Carreras, travesías, festivales y competiciones de escalada de todo
          el mundo, reunidos en un solo sitio. Muy pronto.
        </p>
      </main>
    </div>
  );
}
