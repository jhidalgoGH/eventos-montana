// Genera /robots.txt: la "puerta abierta" para los buscadores.
// Permitimos todo menos la puerta de servicio interna (/api).

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: "https://eventos-montana.vercel.app/sitemap.xml",
  };
}
