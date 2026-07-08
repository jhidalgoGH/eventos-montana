// Utilidad puntual: rellenar el campo image de las menciones ya guardadas
// (el recolector solo lo hace para menciones nuevas) y mostrar las portadas
// de los eventos de la agenda verificada.
import { readFileSync, writeFileSync } from "node:fs";
import { fetchText, extractOgImage } from "./lib/util.mjs";

const path = new URL("../data/mentions.json", import.meta.url);
const data = JSON.parse(readFileSync(path, "utf8"));

let rellenadas = 0;
for (const m of data.mentions) {
  if (m.image !== undefined) continue; // ya procesada
  try {
    const html = await fetchText(m.url, { timeoutMs: 10000 });
    m.image = extractOgImage(html);
    if (m.image) rellenadas++;
  } catch {
    m.image = null; // inaccesible: marcada para no reintentar
  }
}
writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`Menciones con imagen rellenada: ${rellenadas} de ${data.mentions.length}`);

// Portadas de la agenda verificada
for (const url of [
  "https://fedme.es/escalada/",
  "https://torellomountainfilm.cat/",
  "https://mendifilmfestival.com/es/",
]) {
  try {
    const html = await fetchText(url, { timeoutMs: 10000 });
    console.log(url, "->", extractOgImage(html));
  } catch (e) {
    console.log(url, "-> ERROR", e.message);
  }
}
