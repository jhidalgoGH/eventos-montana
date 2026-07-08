// Recolector principal de eventos de montaña.
//
// Se ejecuta una vez al día (GitHub Actions) o a mano: `node scripts/collect.mjs`
//
// Fuentes:
//   1. Rockthesport  — API pública de la plataforma de inscripciones (carreras trail)
//   2. FEDME         — calendario oficial 2026 (archivo data/seed-fedme.json)
//   3. Google Alerts — 5 alertas RSS + extracción de datos schema.org/Event
//   4. Desnivel      — feed RSS, noticias de festivales y cultura de montaña
//
// Resultado:
//   data/events.json    — eventos futuros, ordenados por fecha (los usa la web)
//   data/mentions.json  — noticias/menciones sin ficha de evento (reserva)
//   data/seen-urls.json — URLs ya visitadas, para no repetir trabajo cada día
//
// El archivo de eventos es acumulativo: cada día se añaden los descubrimientos
// nuevos, se actualizan los repetidos y se retiran los eventos ya pasados.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { eventKey, today } from "./lib/util.mjs";
import { collectRockthesport } from "./lib/rockthesport.mjs";
import { collectGoogleAlerts } from "./lib/google-alerts.mjs";
import { collectDesnivel } from "./lib/desnivel.mjs";
import { collectFam } from "./lib/fam.mjs";
import { collectRunnea } from "./lib/runnea.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "data");

function loadJson(path, fallback) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback;
}

function saveJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n", "utf8");
}

// --- 1. Estado anterior -----------------------------------------------------
const previous = loadJson(join(DATA, "events.json"), { events: [] });
const seenUrls = loadJson(join(DATA, "seen-urls.json"), {});
const prevMentions = loadJson(join(DATA, "mentions.json"), { mentions: [] });

// --- 2. Recoger de todas las fuentes (si una falla, las demás siguen) -------
const collected = [];
const newMentions = [];

console.log("Recogiendo eventos...");

try {
  const rts = await collectRockthesport();
  console.log(`  Rockthesport: ${rts.length} eventos`);
  collected.push(...rts);
} catch (err) {
  console.error(`  Rockthesport FALLÓ: ${err.message}`);
}

// Semillas: archivos data/seed-*.json con eventos verificados a mano
// (calendarios oficiales, festivales...). Cada archivo puede llevar un bloque
// "defaults" con campos comunes que se aplican a todos sus eventos.
try {
  const seedFiles = readdirSync(DATA).filter((f) => f.startsWith("seed-") && f.endsWith(".json"));
  let total = 0;
  for (const file of seedFiles) {
    const seed = loadJson(join(DATA, file), { events: [] });
    for (const ev of seed.events) {
      collected.push({ ...(seed.defaults || {}), ...ev });
      total++;
    }
  }
  console.log(`  Semillas (${seedFiles.length} archivos): ${total} eventos`);
} catch (err) {
  console.error(`  Semillas FALLARON: ${err.message}`);
}

try {
  const fam = await collectFam();
  console.log(`  FAM (andadas Aragón): ${fam.length} eventos`);
  collected.push(...fam);
} catch (err) {
  console.error(`  FAM FALLÓ: ${err.message}`);
}

try {
  const runnea = await collectRunnea(seenUrls);
  console.log(`  Runnea: ${runnea.events.length} eventos`);
  collected.push(...runnea.events);
  Object.assign(seenUrls, runnea.seen);
} catch (err) {
  console.error(`  Runnea FALLÓ: ${err.message}`);
}

try {
  const alerts = await collectGoogleAlerts(seenUrls);
  console.log(`  Google Alerts: ${alerts.events.length} eventos, ${alerts.mentions.length} menciones`);
  collected.push(...alerts.events);
  newMentions.push(...alerts.mentions);
  Object.assign(seenUrls, alerts.seen);
} catch (err) {
  console.error(`  Google Alerts FALLÓ: ${err.message}`);
}

try {
  const desnivel = await collectDesnivel(seenUrls);
  console.log(`  Desnivel: ${desnivel.events.length} eventos, ${desnivel.mentions.length} menciones`);
  collected.push(...desnivel.events);
  newMentions.push(...desnivel.mentions);
  Object.assign(seenUrls, desnivel.seen);
} catch (err) {
  console.error(`  Desnivel FALLÓ: ${err.message}`);
}

// --- 3. Fusionar con lo anterior, deduplicar y quitar pasados ---------------
const merged = new Map();

// Primero lo ya conocido (para que los eventos descubiertos días atrás no se pierdan)
for (const ev of previous.events) merged.set(eventKey(ev), ev);
// Después lo recogido hoy (si coincide la clave, el dato nuevo actualiza al viejo)
for (const ev of collected) {
  if (!ev.name || !ev.startDate) continue;
  merged.set(eventKey(ev), { ...merged.get(eventKey(ev)), ...ev });
}

const cutoff = today();
const events = [...merged.values()]
  .filter((ev) => String(ev.startDate).slice(0, 10) >= cutoff)
  .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)));

// --- 4. Menciones: añadir nuevas al principio, conservar 100 como máximo ----
const mentions = [
  ...newMentions.map((m) => ({ ...m, date: today() })),
  ...prevMentions.mentions,
].slice(0, 100);

// --- 5. Guardar --------------------------------------------------------------
// Las URLs vistas caducan a los 180 días para que el archivo no crezca sin fin.
const expiry = new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString().slice(0, 10);
for (const [url, seen] of Object.entries(seenUrls)) {
  if (seen < expiry) delete seenUrls[url];
}

saveJson(join(DATA, "events.json"), { updatedAt: new Date().toISOString(), events });
saveJson(join(DATA, "mentions.json"), { mentions });
saveJson(join(DATA, "seen-urls.json"), seenUrls);

console.log(`\nTotal: ${events.length} eventos futuros guardados en data/events.json`);
