// La dirección pública del sitio, para lo que necesita URLs completas
// (sitemap, robots, links para compartir). Antes estaba escrita a mano como
// rumbo-eight.vercel.app, que es otra app: el sitemap le pasaba a Google
// direcciones de otro sitio.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rumboapp.uy"
