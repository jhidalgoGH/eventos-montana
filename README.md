# ⛰️ Eventos de Montaña

**https://eventos-montana.vercel.app**

Una web que reúne en un solo sitio los próximos eventos de montaña — carreras,
travesías y marchas senderistas, festivales, competiciones de escalada — con su
fecha, lugar, cartel y un enlace a la web oficial de cada evento. Hoy cubre
España, Andorra y Portugal, y está diseñada para crecer a Europa y al resto del
mundo.

Es un proyecto personal de aprendizaje, sin ánimo de lucro y con coste cero de
funcionamiento.

## Qué hace

- **Muestra un calendario** de cientos de eventos futuros, agrupados por mes.
  Cada mes se pliega y despliega, y cada evento enlaza a su web original, que
  es donde están la información oficial y las inscripciones.
- **Muestra un "Radar"** con titulares de prensa sobre eventos de montaña:
  novedades, crónicas y también cancelaciones — cosas que un calendario no
  sabe contar.
- **Se actualiza sola cada mañana**, sin que nadie tenga que tocar nada.

## Cómo lo hace (explicado sin tecnicismos)

Cada día, a primera hora, un programa recorre varias fuentes públicas y anota
los eventos que encuentra:

1. **Plataformas de inscripción** (Rockthesport, Runnea): donde los
   organizadores publican sus carreras para que la gente se apunte. Son la
   fuente más rica: dan nombre, fecha, provincia y cartel.
2. **Organismos oficiales** (la federación española FEDME, la aragonesa FAM,
   y la asociación internacional de trail ITRA): sus calendarios oficiales de
   competiciones y andadas populares.
3. **Alertas de Google y prensa de montaña** (Desnivel): avisan de noticias
   que mencionan eventos. Si la noticia lleva la ficha del evento en formato
   estándar, entra al calendario; si no, se queda como titular en el Radar.
4. **Una agenda verificada a mano**: los pocos eventos importantes (festivales
   de cine de montaña, campeonatos) que ninguna fuente automática cubre bien.

Antes de publicar nada, el programa hace limpieza:

- **Descarta lo que no es de montaña** (las alertas traen de todo: hasta
  partidos de fútbol del Mundial intentaron colarse una vez).
- **Detecta duplicados**: el mismo evento suele aparecer en varias fuentes con
  nombres ligeramente distintos; se queda una sola ficha, combinando lo mejor
  de cada fuente.
- **Retira los eventos ya pasados** y ordena el resto por fecha.

El resultado se guarda y la web se reconstruye y publica automáticamente con
los datos frescos. Todo el proceso funciona con los planes gratuitos de dos
servicios: GitHub (donde vive el código y se ejecuta la tarea diaria) y Vercel
(donde se publica la web). No usa inteligencia artificial en su funcionamiento
diario: son programas normales, escritos una vez, que trabajan solos.

## Respeto a las fuentes

El recolector visita cada fuente una vez al día, se identifica honestamente,
respeta las normas que cada web publica para robots, y guarda solo los datos
básicos (nombre, fecha, lugar) enlazando siempre a la web original — a la que
este proyecto envía visitantes, no se los quita.

## Aviso

La información se recopila automáticamente y puede contener errores o quedar
desactualizada (los eventos se cancelan, cambian de fecha...). Consulta siempre
la web oficial del evento antes de planificar nada.
