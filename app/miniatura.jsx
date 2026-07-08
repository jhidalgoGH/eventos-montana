"use client";
// Miniatura de evento o noticia: muestra la imagen y, si no carga (enlaces
// rotos, webs que bloquean el acceso externo a sus fotos), cae al recuadro
// con el emoji del tipo. Necesita ejecutarse en el navegador ("use client")
// para poder reaccionar al fallo de carga.

import { useState } from "react";

export default function Miniatura({ image, emoji, classes, size = "h-14 w-14" }) {
  const [rota, setRota] = useState(false);

  if (image && !rota) {
    return (
      <img
        src={image}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setRota(true)}
        className={`${size} shrink-0 rounded-lg bg-zinc-100 object-cover dark:bg-zinc-800`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`flex ${size} shrink-0 items-center justify-center rounded-lg text-2xl ${classes}`}
    >
      {emoji}
    </span>
  );
}
