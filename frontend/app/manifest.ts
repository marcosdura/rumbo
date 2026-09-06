import type { MetadataRoute } from "next"

// Convención de archivo nativa de Next: genera /manifest.webmanifest e inyecta
// el <link rel="manifest"> solo, sin necesidad de declararlo en el metadata.
//
// Con esto (más HTTPS, que ya da Vercel) la app es instalable en Android e iOS.
// No hace falta service worker: eso es para offline y push, que quedan aparte.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rumbo — Encontrá tu próxima aventura en Uruguay",
    short_name: "Rumbo",
    description:
      "Descubrí los mejores lugares para camping, trekking, escalada, surf y kayak en Uruguay.",
    start_url: "/",
    display: "standalone",
    lang: "es",
    // Mismos valores que el sitio: --background y --primary-dark de globals.css
    background_color: "#f5f4f0",
    theme_color: "#1b4332",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
