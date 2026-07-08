// Recolector de la FAM (Federación Aragonesa de Montañismo).
//
// Su calendario de andadas populares es una tabla HTML con columnas fijas:
// nº | fecha (dd-mm-aa) | edición | nombre | organizador | población |
// provincia (ZA/HU/TE) | ... | km | ... | ChiquiFAM | web
// https://www.fam.es/comites/andadas-populares/calendario

import { fetchText, stripHtml } from "./util.mjs";

const URL_CALENDARIO = "https://www.fam.es/comites/andadas-populares/calendario";

const PROVINCIAS = { ZA: "Zaragoza", HU: "Huesca", TE: "Teruel" };

// "18-07-26" -> "2026-07-18" (o null si no es una fecha válida)
function parseFecha(texto) {
  const m = /^(\d{2})-(\d{2})-(\d{2})$/.exec(texto.trim());
  if (!m) return null;
  return `20${m[3]}-${m[2]}-${m[1]}`;
}

export async function collectFam() {
  const html = await fetchText(URL_CALENDARIO);
  const tabla = /<table[\s\S]*?<\/table>/.exec(html)?.[0];
  if (!tabla) throw new Error("No se encontró la tabla del calendario");

  const events = [];
  for (const fila of tabla.matchAll(/<tr[\s\S]*?<\/tr>/g)) {
    const celdas = [...fila[0].matchAll(/<td[\s\S]*?<\/td>/g)].map((c) => stripHtml(c[0]));
    if (celdas.length < 7) continue; // cabecera u otra fila rara

    const startDate = parseFecha(celdas[1]);
    const name = celdas[3];
    if (!startDate || !name) continue;

    // La celda de la web puede llevar enlace; si no, enlazamos al calendario FAM.
    const enlace = /href="(https?:\/\/[^"]+)"/.exec(fila[0])?.[1];
    const poblacion = celdas[5];
    const provincia = PROVINCIAS[celdas[6]] || celdas[6] || null;

    events.push({
      name,
      type: "travesia",
      startDate,
      endDate: null,
      locationName: [poblacion, provincia].filter(Boolean).join(", ") || "Aragón",
      country: "España",
      url: enlace || URL_CALENDARIO,
      source: "fam",
      sourceName: "FAM (andadas populares)",
    });
  }

  return events;
}
