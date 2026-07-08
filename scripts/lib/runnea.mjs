// Recolector de Runnea (portal español de running, runnea.com).
//
// Sus fichas de carrera llevan datos estructurados schema.org/Event con
// nombre, fecha e imagen. Recorremos sus listados (calendario de trail y
// portada de carreras), visitamos las fichas nuevas y extraemos el evento.
// Runnea lista también carreras de asfalto (maratones, 10K, Ironman...),
// así que solo aceptamos las que suenan a montaña.
//
// robots.txt comprobado 2026-07-08: bloquea robots de SEO concretos y rutas
// de su tienda; la sección de carreras es accesible para agentes genéricos.

import { fetchText, extractOgImage, pareceDeMontana, classify } from "./util.mjs";
import { extractEventsFromHtml } from "./schema-events.mjs";

const LISTADOS = [
  "https://www.runnea.com/carreras-populares/calendario/trail/",
  "https://www.runnea.com/carreras-populares/",
];

const PAISES = {
  espana: "España",
  francia: "Francia",
  andorra: "Andorra",
  portugal: "Portugal",
  italia: "Italia",
  suiza: "Suiza",
  marruecos: "Marruecos",
};

// Runnea escribe los lugares en minúsculas y con el país dentro
// ("Valle de Benasque, huesca, espana"). Los arreglamos: separamos el país
// y ponemos mayúsculas iniciales en el resto.
function limpiarLugar(texto) {
  if (!texto) return { locationName: null, country: undefined };
  const partes = String(texto).split(",").map((p) => p.trim()).filter(Boolean);
  let country;
  if (partes.length > 0) {
    const ultima = partes[partes.length - 1].toLowerCase().replace(/-/g, " ").trim();
    if (PAISES[ultima.replace(/ /g, "")]) {
      country = PAISES[ultima.replace(/ /g, "")];
      partes.pop();
    }
  }
  const conMayusculas = partes.map((parte) =>
    parte
      .replace(/-/g, " ")
      .split(" ")
      .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ")
  );
  return { locationName: conMayusculas.join(", ") || null, country };
}

export async function collectRunnea(seenUrls, { maxPagesPerRun = 25 } = {}) {
  const events = [];
  const newlySeen = {};

  // 1. Reunir las fichas de carrera enlazadas desde los listados.
  const fichas = new Set();
  for (const listado of LISTADOS) {
    try {
      const html = await fetchText(listado);
      for (const m of html.matchAll(/href="(\/carreras-populares\/[a-z0-9-]+\/)"/g)) {
        if (!m[1].includes("calendario")) fichas.add(`https://www.runnea.com${m[1]}`);
      }
    } catch (err) {
      console.error(`  [runnea] Listado ilegible (${listado}): ${err.message}`);
    }
  }

  // 2. Visitar solo las fichas no vistas, con tope por ejecución.
  //    Las que no entren hoy quedan sin marcar y se visitarán mañana.
  let visitadas = 0;
  for (const url of fichas) {
    if (seenUrls[url] || newlySeen[url]) continue;
    if (visitadas >= maxPagesPerRun) break;
    visitadas++;
    newlySeen[url] = new Date().toISOString().slice(0, 10);

    try {
      const html = await fetchText(url);
      const portada = extractOgImage(html);
      for (const ev of extractEventsFromHtml(html, url)) {
        if (!pareceDeMontana(ev.name)) continue; // asfalto u otros deportes
        const lugar = limpiarLugar(ev.locationName);
        events.push({
          ...ev,
          ...lugar,
          image: ev.image || portada,
          type: classify(ev.name, "carrera"),
          source: "runnea",
          sourceName: "Runnea",
        });
      }
    } catch {
      // ficha inaccesible: quedó marcada como vista, no insistimos
    }
  }

  return { events, seen: newlySeen };
}
