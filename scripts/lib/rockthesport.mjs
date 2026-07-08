// Recolector de Rockthesport (plataforma de inscripciones líder en España).
//
// Usa la misma API pública que usa su propia web (publicservice.rockthesport.com)
// para pedir los próximos eventos de trail en España, ordenados por fecha.
// Una sola pasada al día, identificándonos en el user-agent.

import { fetchJson, UA } from "./util.mjs";

const API = "https://publicservice.rockthesport.com/api";
const SPAIN_COUNTRY_ID = 65;
const PAGE_SIZE = 50;
const MAX_PAGES = 10;

// Categorías de Rockthesport que nos interesan y el tipo de evento por defecto.
// Sus categorías son imprecisas (en "mountaineering" hay también carreras),
// así que el tipo definitivo lo decide classify() mirando el nombre.
const CATEGORIES = [
  { slug: "trail", defaultType: "carrera" },
  { slug: "mountaineering", defaultType: "travesia" },
  { slug: "climbing", defaultType: "escalada" },
  { slug: "orienteering", defaultType: "otro" },
];

// Decide el tipo de evento a partir del nombre; si no hay pistas, usa el de la categoría.
function classify(title, defaultType) {
  const t = title.toLowerCase();
  if (/(encuentro|jornada|congreso)/.test(t)) return "otro";
  if (/(marcha|traves[ií]|travessa|andada|caminata|senderis|hiking|trek)/.test(t)) return "travesia";
  if (/(escalada|climbing|boulder|bloque|rocódromo|rocodromo)/.test(t)) return "escalada";
  if (/(trail|carrera|cursa|lasterketa|race|cxm|marat[oó]n|marathon|skyrace|sky race|vertical|bertikala|\bkv\b|\bultra\b|cross|milla)/.test(t)) return "carrera";
  return defaultType;
}

// Clave pública que la web de Rockthesport incluye en su propio código y
// envía el navegador de cualquier visitante (no es una credencial privada).
const HEADERS = {
  "x-api-key": "rts_public_web_2024_a8f3d9e1c4b7",
  referer: "https://web.rockthesport.com/",
  "x-requested-with": "XMLHttpRequest",
};

// Descarga el mapa provinciaId -> nombre ("52" -> "Lleida").
async function loadProvinces() {
  const map = {};
  try {
    const res = await fetchJson(`${API}/metadata/es/country/${SPAIN_COUNTRY_ID}/states`, { headers: HEADERS });
    // La respuesta puede venir como lista directa o envuelta en .data
    const list = Array.isArray(res) ? res : res?.data || [];
    for (const p of list) {
      const id = p.id ?? p.stateId ?? p.provinceId;
      const name = p.name ?? p.title ?? p.value;
      if (id != null && name) map[id] = name;
    }
  } catch (err) {
    console.error(`  [rockthesport] Sin mapa de provincias: ${err.message}`);
  }
  return map;
}

export async function collectRockthesport() {
  const provinces = await loadProvinces();
  const events = [];

  for (const category of CATEGORIES) {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = `${API}/event/es/category/${category.slug}?pageNumber=${page}&pageSize=${PAGE_SIZE}`;
      const body = {
        "(a) orderBy": "data.dates.startedDateTimestamp",
        "(ge) data.dates.startedDateTimestamp": Date.now(),
        kind: `country:${SPAIN_COUNTRY_ID}`,
        "data.sport": category.slug,
      };
      const res = await fetchJson(url, {
        method: "POST",
        headers: { "content-type": "application/json", "user-agent": UA, ...HEADERS },
        body: JSON.stringify(body),
      });
      const items = res?.data?.items || [];

      for (const item of items) {
        if (!item.title || !item.startedDateIso) continue;
        events.push({
          name: item.title,
          type: classify(item.title, category.defaultType),
          startDate: item.startedDateIso,
          endDate: item.dates?.endDateIso || null,
          locationName: provinces[item.provinceId] || null,
          country: "España",
          url: `https://web.rockthesport.com/es/event/${item.slug}`,
          source: "rockthesport",
          sourceName: "Rockthesport",
        });
      }

      if (items.length < PAGE_SIZE) break; // última página de esta categoría
    }
  }

  return events;
}
