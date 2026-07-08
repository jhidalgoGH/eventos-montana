// Lector de los feeds RSS de Google Alerts.
//
// Cada alerta creada en google.com/alerts con entrega "Feed RSS" tiene una
// URL fija. Google va añadiendo entradas según encuentra páginas nuevas que
// coinciden con la búsqueda. Cada entrada enlaza a la página encontrada a
// través de un redirector de Google (google.com/url?...&url=DESTINO), del
// que extraemos la URL real.

import { XMLParser } from "fast-xml-parser";
import { fetchText, stripHtml, extractOgImage, pareceDeMontana } from "./util.mjs";
import { extractEventsFromHtml } from "./schema-events.mjs";

// Las 5 alertas creadas por el usuario, con el tipo de evento que sugiere
// cada búsqueda (se usa para clasificar los eventos encontrados).
export const ALERT_FEEDS = [
  { url: "https://www.google.com/alerts/feeds/01980495521267906343/6169901570152719379", typeHint: "carrera" }, // "carrera por montaña"
  { url: "https://www.google.com/alerts/feeds/01980495521267906343/3506819103353236395", typeHint: "carrera" }, // "trail running"
  { url: "https://www.google.com/alerts/feeds/01980495521267906343/882421484847661097", typeHint: "travesia" }, // "travesía de montaña"
  { url: "https://www.google.com/alerts/feeds/01980495521267906343/14293000917616631685", typeHint: "festival" }, // "festival de montaña"
  { url: "https://www.google.com/alerts/feeds/01980495521267906343/7042373467158163444", typeHint: "escalada" }, // competición escalada
];

const parser = new XMLParser({ ignoreAttributes: false });

// Del enlace redirector de Google saca la URL real de destino.
function realUrl(googleUrl) {
  try {
    const u = new URL(googleUrl);
    return u.searchParams.get("url") || googleUrl;
  } catch {
    return googleUrl;
  }
}

// Lee un feed y devuelve sus entradas: { title, url }.
async function readFeed(feedUrl) {
  const xml = await fetchText(feedUrl);
  const doc = parser.parse(xml);
  let entries = doc?.feed?.entry || [];
  if (!Array.isArray(entries)) entries = [entries];
  return entries.map((e) => ({
    title: stripHtml(e.title?.["#text"] ?? e.title ?? ""),
    url: realUrl(e.link?.["@_href"] ?? ""),
  }));
}

// Recorre las alertas, visita las páginas nuevas (no vistas en ejecuciones
// anteriores) y devuelve { events, mentions, seen }.
export async function collectGoogleAlerts(seenUrls, { maxPagesPerRun = 40 } = {}) {
  const events = [];
  const mentions = [];
  const newlySeen = {};
  let visited = 0;

  for (const feed of ALERT_FEEDS) {
    let entries;
    try {
      entries = await readFeed(feed.url);
    } catch (err) {
      console.error(`  [alerts] Feed ilegible (${feed.typeHint}): ${err.message}`);
      continue;
    }
    for (const entry of entries) {
      if (!entry.url || seenUrls[entry.url] || newlySeen[entry.url]) continue;
      newlySeen[entry.url] = new Date().toISOString().slice(0, 10);
      if (visited >= maxPagesPerRun) continue; // registrada como vista, se procesará otro día si reaparece
      visited++;

      // Visitamos la página buscando datos estructurados de evento
      // y su imagen de portada.
      let found = [];
      let portada = null;
      try {
        const html = await fetchText(entry.url);
        // Solo aceptamos eventos cuyo nombre suene a montaña: las páginas de
        // noticias llevan a veces datos estructurados de eventos ajenos
        // (partidos, conciertos...) que no queremos en el calendario.
        found = extractEventsFromHtml(html, entry.url).filter((ev) => pareceDeMontana(ev.name));
        portada = extractOgImage(html);
      } catch {
        // Página caída o bloqueada: la guardamos solo como mención.
      }

      if (found.length > 0) {
        for (const ev of found) {
          events.push({
            ...ev,
            image: ev.image || portada,
            type: feed.typeHint,
            source: "google-alerts",
            sourceName: "Google Alerts",
          });
        }
      } else {
        mentions.push({ title: entry.title, url: entry.url, typeHint: feed.typeHint, image: portada });
      }
    }
  }

  return { events, mentions, seen: newlySeen };
}
