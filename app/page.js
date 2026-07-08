import data from "@/data/events.json";

// Etiqueta y color de cada tipo de evento.
const TIPOS = {
  carrera: { label: "Carrera", classes: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200" },
  travesia: { label: "Travesía", classes: "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200" },
  festival: { label: "Festival", classes: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200" },
  escalada: { label: "Escalada", classes: "bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200" },
  otro: { label: "Otro", classes: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
};

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MESES_CORTO = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// "2026-07-11T06:30:00" -> { year: 2026, month: 6, day: 11 }
function parseDate(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

// Texto de fecha del evento: "11 jul" o "18–20 sep" si dura varios días.
function fechaTexto(ev) {
  const ini = parseDate(ev.startDate);
  if (ev.endDate) {
    const fin = parseDate(ev.endDate);
    if (fin.day !== ini.day || fin.month !== ini.month) {
      if (fin.month === ini.month) return `${ini.day}–${fin.day} ${MESES_CORTO[ini.month]}`;
      return `${ini.day} ${MESES_CORTO[ini.month]} – ${fin.day} ${MESES_CORTO[fin.month]}`;
    }
  }
  return `${ini.day} ${MESES_CORTO[ini.month]}`;
}

// Agrupa los eventos por mes de inicio, respetando el orden por fecha.
function porMeses(events) {
  const grupos = [];
  let actual = null;
  for (const ev of events) {
    const { year, month } = parseDate(ev.startDate);
    const clave = `${year}-${month}`;
    if (!actual || actual.clave !== clave) {
      actual = { clave, titulo: `${MESES[month]} ${year}`, eventos: [] };
      grupos.push(actual);
    }
    actual.eventos.push(ev);
  }
  return grupos;
}

export default function Home() {
  const grupos = porMeses(data.events);
  const actualizado = new Date(data.updatedAt);
  const fechaActualizado = `${actualizado.getDate()} de ${MESES[actualizado.getMonth()]} de ${actualizado.getFullYear()}`;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="border-b border-zinc-200 bg-white px-6 py-10 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            ⛰️ Eventos de Montaña
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Carreras, travesías, festivales y competiciones de escalada, reunidos
            automáticamente de fuentes públicas.
          </p>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-500">
            {data.events.length} eventos próximos · Actualizado el {fechaActualizado}
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        {grupos.map((grupo) => (
          <section key={grupo.clave} className="mb-10">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              {grupo.titulo}
            </h2>
            <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
              {grupo.eventos.map((ev, i) => {
                const tipo = TIPOS[ev.type] || TIPOS.otro;
                return (
                  <li key={i} className="flex items-baseline gap-4 px-4 py-3">
                    <span className="w-24 shrink-0 text-sm font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
                      {fechaTexto(ev)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noopener nofollow"
                        className="font-medium text-black underline-offset-2 hover:underline dark:text-zinc-50"
                      >
                        {ev.name}
                      </a>
                      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                        {[ev.locationName, ev.country !== "España" ? ev.country : null]
                          .filter(Boolean)
                          .join(" · ") || "Lugar por confirmar"}
                        <span className="text-zinc-400 dark:text-zinc-600"> · vía {ev.sourceName}</span>
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${tipo.classes}`}>
                      {tipo.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </main>

      <footer className="border-t border-zinc-200 bg-white px-6 py-6 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="mx-auto max-w-3xl text-sm text-zinc-500 dark:text-zinc-500">
          Los datos se recogen una vez al día de fuentes públicas (Rockthesport,
          FEDME, Desnivel y alertas de Google). Cada evento enlaza a su web
          original, donde está la información oficial e inscripciones. Proyecto
          de aprendizaje sin ánimo de lucro ·{" "}
          <a
            href="https://github.com/jhidalgoGH/eventos-montana"
            className="underline underline-offset-2"
            target="_blank"
            rel="noopener"
          >
            código en GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
