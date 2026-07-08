// Recolector de la ITRA (International Trail Running Association, itra.run).
//
// Su calendario mundial (~1.400 eventos a 12 meses vista) se obtiene con un
// POST a la propia página del calendario, que exige el token de seguridad
// (antiforgery) incluido en la página inicial. La respuesta trae todos los
// eventos incrustados; filtramos por país al procesarla.
//
// robots.txt comprobado 2026-07-08: permite el rastreo (solo bloquea imágenes).

import { UA, stripHtml, classify } from "./util.mjs";

const PAGE = "https://itra.run/Races/RaceCalendar";

// Países que publicamos por ahora. Para la fase "Europa", añadir aquí
// FRA: "Francia", ITA: "Italia", etc.
const COUNTRIES = { ESP: "España", AND: "Andorra", PRT: "Portugal" };

const MONTHS = {
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
  July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
};

const fmt = (d) =>
  `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;

export async function collectItra() {
  // 1. GET inicial: token antiforgery + cookies de sesión.
  const r1 = await fetch(PAGE, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(30000) });
  if (!r1.ok) throw new Error(`HTTP ${r1.status} al pedir la página inicial`);
  const html1 = await r1.text();
  const token = /name="__RequestVerificationToken"[^>]*value="([^"]+)"/.exec(html1)?.[1];
  if (!token) throw new Error("No se encontró el token antiforgery");
  const cookies = (r1.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");

  // 2. POST: calendario de los próximos 12 meses (mundial).
  const body = new URLSearchParams({
    "Input.isDateFilterApplied": "true",
    name: "",
    "Input.DateStart": fmt(new Date()),
    "Input.DateEnd": fmt(new Date(Date.now() + 365 * 24 * 3600 * 1000)),
    "Input.DateValue": "5",
    countMap: "1",
    __RequestVerificationToken: token,
  });
  const r2 = await fetch(PAGE, {
    method: "POST",
    headers: { "user-agent": UA, "content-type": "application/x-www-form-urlencoded", cookie: cookies },
    body: body.toString(),
    signal: AbortSignal.timeout(120000),
  });
  if (!r2.ok) throw new Error(`HTTP ${r2.status} en el POST del calendario`);
  const html = await r2.text();

  // 3. Extraer los bloques de evento: nombre + enlace, fecha y lugar.
  const events = [];
  const re =
    /class='event_name'><a href='([^']+)'[^>]*><h4>([\s\S]*?)<\/h4\s*>[\s\S]{0,700}?class='date'><span>([^<]+)<\/span>\s*([A-Za-z]+)\s*<d><\/d>\s*(\d{4})[\s\S]{0,400}?class='location'>([^<]+)</g;

  for (const m of html.matchAll(re)) {
    const [, href, rawName, dias, mesEn, anio, rawLoc] = m;
    const lugar = stripHtml(rawLoc).trim(); // "Benasque, ESP"
    const iso3 = lugar.slice(-3).toUpperCase();
    if (!COUNTRIES[iso3]) continue;

    const mes = MONTHS[mesEn];
    const numeros = (dias.match(/\d+/g) || []).map(Number);
    if (!mes || numeros.length === 0) continue;

    const fecha = (dia) => `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    const name = stripHtml(rawName);

    events.push({
      name,
      type: classify(name, "carrera"),
      startDate: fecha(numeros[0]),
      endDate: numeros.length > 1 ? fecha(numeros[numeros.length - 1]) : null,
      locationName: lugar.slice(0, -3).replace(/[,\s]+$/, "") || null,
      country: COUNTRIES[iso3],
      url: `https://itra.run${href}`,
      source: "itra",
      sourceName: "ITRA",
    });
  }

  return events;
}
