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
    .replace(/\s+/g, " ")
    .trim();
}
