// Extractor de eventos schema.org (JSON-LD) de una página HTML.
//
// Muchas webs de eventos incluyen un bloque <script type="application/ld+json">
// con los datos del evento en formato estándar (es lo que usa Google para su
// buscador de eventos). Si existe, obtenemos nombre, fechas y lugar sin
// necesidad de entender el HTML de cada web.

const RE_LDJSON = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

// ¿Es este objeto un evento? (Event o cualquiera de sus subtipos)
function isEventType(type) {
  const types = Array.isArray(type) ? type : [type];
  return types.some((t) => typeof t === "string" && /event|festival/i.test(t));
}

// Recorre un objeto JSON-LD (que puede tener @graph, arrays anidados...)
// y devuelve todos los objetos de tipo Event que encuentre.
function findEventObjects(node, found = []) {
  if (!node || typeof node !== "object") return found;
  if (Array.isArray(node)) {
    for (const item of node) findEventObjects(item, found);
    return found;
  }
  if (isEventType(node["@type"])) found.push(node);
  if (node["@graph"]) findEventObjects(node["@graph"], found);
  if (node.itemListElement) findEventObjects(node.itemListElement, found);
  if (node.item) findEventObjects(node.item, found);
  return found;
}

// Convierte el campo location de schema.org (muy variado) en un texto legible.
function locationToText(location) {
  if (!location) return null;
  const loc = Array.isArray(location) ? location[0] : location;
  if (typeof loc === "string") return loc;
  const parts = [];
  if (loc.name) parts.push(loc.name);
  const addr = loc.address;
  if (addr && typeof addr === "object") {
    for (const campo of ["addressLocality", "addressRegion", "addressCountry"]) {
      const v = typeof addr[campo] === "object" ? addr[campo]?.name : addr[campo];
      if (v && !parts.includes(v)) parts.push(v);
    }
  } else if (typeof addr === "string") {
    parts.push(addr);
  }
  return parts.length ? parts.join(", ") : null;
}

// Extrae eventos de un HTML. Devuelve una lista (posiblemente vacía).
export function extractEventsFromHtml(html, pageUrl) {
  const events = [];
  for (const match of html.matchAll(RE_LDJSON)) {
    let data;
    try {
      data = JSON.parse(match[1].trim());
    } catch {
      continue; // JSON mal formado: lo ignoramos
    }
    for (const obj of findEventObjects(data)) {
      if (!obj.name || !obj.startDate) continue;
      events.push({
        name: String(obj.name).trim(),
        startDate: String(obj.startDate),
        endDate: obj.endDate ? String(obj.endDate) : null,
        locationName: locationToText(obj.location),
        url: typeof obj.url === "string" && obj.url.startsWith("http") ? obj.url : pageUrl,
      });
    }
  }
  return events;
}
