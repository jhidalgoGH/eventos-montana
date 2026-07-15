import data from "@/data/events.json";
import radar from "@/data/mentions.json";
import Miniatura from "./miniatura";

// Etiqueta y color de cada tipo de evento.
const TIPOS = {
  carrera: { label: "Carrera", emoji: "🏃", classes: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200" },
  travesia: { label: "Travesía", emoji: "🥾", classes: "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200" },
  festival: { label: "Festival", emoji: "🎬", classes: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200" },
  escalada: { label: "Escalada", emoji: "🧗", classes: "bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200" },
  otro: { label: "Otro", emoji: "⛰️", classes: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
};

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MESES_CORTO = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// "www.heraldo.es" a partir de la URL de una mención (para dar contexto de la fuente).
function dominio(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

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
// Los años futuros (con pocos eventos aún) se agrupan en una sola fila
// por año para no alargar la lista de meses.
function porMeses(events) {
  const añoActual = new Date().getFullYear();
  const grupos = [];
  let actual = null;
  for (const ev of events) {
    const { year, month } = parseDate(ev.startDate);
    const lejano = year > añoActual;
    const clave = lejano ? `${year}` : `${year}-${month}`;
    if (!actual || actual.clave !== clave) {
      actual = { clave, titulo: lejano ? `${year}` : `${MESES[month]} ${year}`, eventos: [] };
      grupos.push(actual);
    }
    actual.eventos.push(ev);
  }
  return grupos;
}

// Ficha schema.org de los próximos eventos, para que los buscadores puedan
// mostrarlos con formato destacado (el mismo estándar que nosotros leemos
// de otras webs al recolectar).
function fichasParaBuscadores(events) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: events.slice(0, 30).map((ev, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Event",
        name: ev.name,
        startDate: ev.startDate,
        ...(ev.endDate ? { endDate: ev.endDate } : {}),
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: ev.locationName || ev.country || "Por confirmar",
          address: { "@type": "PostalAddress", addressCountry: ev.country || "España" },
        },
        ...(ev.image ? { image: [ev.image] } : {}),
        url: ev.url,
      },
    })),
  };
}

export default function Home() {
  const grupos = porMeses(data.events);
  const actualizado = new Date(data.updatedAt);
  const fechaActualizado = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(actualizado);
  const horaActualizado = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
  }).format(actualizado);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(fichasParaBuscadores(data.events)) }}
      />
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            ⛰️ Eventos de Montaña
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Carreras, travesías, festivales y competiciones de escalada, reunidos
            automáticamente de fuentes públicas. Más un radar de noticias de montaña.
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
            {data.events.length} eventos próximos · Actualizado el {fechaActualizado} a las {horaActualizado}
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-4">
        <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-500">
          Pulsa un mes para ver sus eventos. El mes queda fijado arriba
          mientras lo recorres, para plegarlo y elegir otro.
        </p>
        {grupos.map((grupo) => (
          <details
            key={grupo.clave}
            className="group mb-1.5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
          >
            <summary className="sticky top-0 z-10 flex cursor-pointer select-none items-center gap-3 rounded-xl bg-white px-4 py-2 list-none group-open:rounded-b-none group-open:border-b group-open:border-zinc-200 dark:bg-zinc-950 dark:group-open:border-zinc-800 [&::-webkit-details-marker]:hidden">
              <span
                aria-hidden="true"
                className="text-zinc-400 transition-transform group-open:rotate-90 dark:text-zinc-600"
              >
                ▸
              </span>
              <span className="flex-1 font-semibold capitalize text-black dark:text-zinc-50">
                {grupo.titulo}
              </span>
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {grupo.eventos.length} {grupo.eventos.length === 1 ? "evento" : "eventos"}
              </span>
            </summary>
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {grupo.eventos.map((ev, i) => {
                const tipo = TIPOS[ev.type] || TIPOS.otro;
                return (
                  <li key={i} className="flex items-center gap-4 px-4 py-3">
                    <span className="w-20 shrink-0 text-sm font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
                      {fechaTexto(ev)}
                    </span>
                    <Miniatura image={ev.image} emoji={tipo.emoji} classes={tipo.classes} />
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
          </details>
        ))}

        {radar.mentions.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              📡 Radar
            </h2>
            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-500">
              Titulares sobre eventos de montaña captados por las alertas.
              Información sin verificar: aquí aparecen también cancelaciones,
              crónicas y novedades.
            </p>
            <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
              {radar.mentions.slice(0, 25).map((m, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-3">
                  <Miniatura
                    image={m.image}
                    emoji={(TIPOS[m.typeHint] || TIPOS.otro).emoji}
                    classes={(TIPOS[m.typeHint] || TIPOS.otro).classes}
                    size="h-12 w-12"
                  />
                  <div className="min-w-0 flex-1">
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener nofollow"
                      className="text-sm font-medium text-black underline-offset-2 hover:underline dark:text-zinc-50"
                    >
                      {m.title || m.url}
                    </a>
                    <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-600">
                      {dominio(m.url)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer className="border-t border-zinc-200 bg-white px-6 py-6 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="mx-auto max-w-4xl text-sm text-zinc-500 dark:text-zinc-500">
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
