// Utilidades comunes para todos los recolectores.

// Nos identificamos honestamente ante las webs que visitamos.
export const UA =
  "EventosMontanaBot/1.0 (agregador sin animo de lucro; https://eventos-montana.vercel.app; github.com/jhidalgoGH/eventos-montana)";

// Descarga una URL y devuelve el texto. Falla a los 15s para no colgar el proceso.
export async function fetchText(url, { timeoutMs = 15000 } = {}) {
  const res = await fetch(url, {
    headers: { "user-agent": UA },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  return await res.text();
}

// Igual que fetchText pero interpretando la respuesta como JSON.
export async function fetchJson(url, options = {}, { timeoutMs = 20000 } = {}) {
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept: "application/json", ...(options.headers || {}) },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  return await res.json();
}

// "Trail Vielha-Molières 3010!" -> "trail-vielha-molieres-3010"
export function slug(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Clave de deduplicación: mismo nombre normalizado + misma fecha = mismo evento.
export function eventKey(ev) {
  return `${slug(ev.name)}|${String(ev.startDate || "").slice(0, 10)}`;
}

// Fecha de hoy en formato YYYY-MM-DD.
export function today() {
  return new Date().toISOString().slice(0, 10);
}

// ¿Parece este nombre un evento de montaña? Se usa para descartar eventos
// ajenos (partidos, conciertos...) que aparecen en páginas de noticias con
// datos estructurados propios.
const RE_MONTANA =
  /(monta[ñn]|trail|mendi|muntanya|marcha|traves[ií]|travessa|escalada|climbing|boulder|senderis|andada|alpinis|skyrac|sky race|vertical|bertikala|\bkv\b|\bultra\b|cumbre|pirineo|picos|hiking|trek|km vertical|cxm|festival)/i;

export function pareceDeMontana(text) {
  return RE_MONTANA.test(String(text));
}

// Extrae la imagen de portada de una página (etiqueta og:image, la que usan
// las redes sociales para las vistas previas). Devuelve null si no hay.
export function extractOgImage(html) {
  const m =
    /<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/i.exec(html) ||
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["']/i.exec(html);
  const url = m?.[1];
  return url && /^https?:\/\//.test(url) ? url : null;
}

// Quita etiquetas HTML de un texto ("<b>Gran</b> Trail" -> "Gran Trail").
export function stripHtml(text) {
  return String(text)
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
