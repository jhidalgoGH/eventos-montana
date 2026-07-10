// Punto de entrada que Vercel llama según sus tareas programadas (vercel.json).
// Su único trabajo es dar la orden a GitHub de ejecutar el workflow de
// recogida de eventos — el equivalente automático de pulsar "Run workflow".
//
// Necesita dos variables de entorno configuradas en Vercel:
//   CRON_SECRET  — contraseña que Vercel envía al llamar (rechaza a extraños)
//   GITHUB_TOKEN — token de GitHub con permiso para lanzar workflows del repo

export async function GET(request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("No autorizado", { status: 401 });
  }
  if (!process.env.GITHUB_TOKEN) {
    return Response.json({ error: "Falta GITHUB_TOKEN en Vercel" }, { status: 500 });
  }

  const r = await fetch(
    "https://api.github.com/repos/jhidalgoGH/eventos-montana/actions/workflows/collect.yml/dispatches",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        accept: "application/vnd.github+json",
        "user-agent": "eventos-montana-cron",
      },
      body: JSON.stringify({ ref: "main" }),
    }
  );

  // 204 = GitHub aceptó la orden
  return Response.json({ lanzado: r.status === 204, estadoGitHub: r.status });
}
