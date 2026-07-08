// Recolector de Desnivel.com (revista de montaña de referencia en España).
//
// Lee su feed RSS general (WordPress, se actualiza cada hora) y se queda con
// las noticias de cultura/agenda: festivales, cine de montaña, encuentros...
// En cada artículo intenta extraer datos estructurados de evento; si no los
// hay, lo guarda como mención (noticia con enlace).

import { XMLParser } from "fast-xml-parser";
import { fetchText, stripHtml } from "./util.mjs";
import { extractEventsFromHtml } from "./schema-events.mjs";

const FEED = "https://www.desnivel.com/feed/";
const RE_INTERES = /festival|cine de monta|banff|mendi|semana de monta|encuentro|proyecci|jornadas/i;

const parser = new XMLParser({ ignoreAttributes: false });

export async function collectDesnivel(seenUrls, { maxPagesPerRun = 10 } = {}) {
  const events = [];
  const mentions = [];
  const newlySeen = {};

  const xml = await fetchText(FEED);
  const doc = parser.parse(xml);
  let items = doc?.rss?.channel?.item || [];
  if (!Array.isArray(items)) items = [items];

  let visited = 0;
  for (const item of items) {
    const title = stripHtml(item.title || "");
    const url = String(item.link || "");
    const esCultura = url.includes("/cultura/") || RE_INTERES.test(title);
    if (!url || !esCultura || seenUrls[url] || newlySeen[url]) continue;

    newlySeen[url] = new Date().toISOString().slice(0, 10);
    if (visited >= maxPagesPerRun) continue;
    visited++;

    let found = [];
    try {
      const html = await fetchText(url);
      found = extractEventsFromHtml(html, url);
    } catch {
      // artículo inaccesible: solo mención
    }

    if (found.length > 0) {
      for (const ev of found) {
        events.push({ ...ev, type: "festival", source: "desnivel", sourceName: "Desnivel" });
      }
    } else {
      mentions.push({ title, url, typeHint: "festival" });
    }
  }

  return { events, mentions, seen: newlySeen };
}
