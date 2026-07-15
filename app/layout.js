import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://eventos-montana.vercel.app"),
  verification: {
    google: "JxkIuvOHnxVDSmgGUZYY8BJvXYg_2LNWxOr-Tsc5rUU",
  },
  title: "Eventos de Montaña — Calendario de carreras, travesías, festivales y escalada",
  description:
    "Calendario actualizado dos veces al día con cientos de eventos de montaña en España, Andorra y Portugal: carreras por montaña y trail running, travesías y marchas senderistas, festivales de cine de montaña y competiciones de escalada. Con radar de noticias del mundo de la montaña.",
  openGraph: {
    title: "Eventos de Montaña",
    description:
      "Carreras, travesías, festivales y competiciones de escalada, reunidos automáticamente en un calendario que se actualiza dos veces al día.",
    url: "https://eventos-montana.vercel.app",
    siteName: "Eventos de Montaña",
    locale: "es_ES",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
