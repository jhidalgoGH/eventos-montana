// Genera /sitemap.xml: el índice de contenidos que los buscadores consultan.
// De momento la web es una sola página; cuando haya páginas por evento o por
// provincia, se añadirán aquí.

import data from "@/data/events.json";

export default function sitemap() {
  return [
    {
      url: "https://eventos-montana.vercel.app/",
      lastModified: new Date(data.updatedAt),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
