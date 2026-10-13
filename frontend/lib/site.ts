// La dirección pública del sitio, para lo que necesita URLs completas
// (sitemap, robots, links para compartir). Antes estaba escrita a mano como
// rumbo-eight.vercel.app, que es otra app: el sitemap le pasaba a Google
// direcciones de otro sitio.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rumboapp.uy"

// Servidores a los que el navegador conviene conectarse antes de necesitarlos
// (<link rel="preconnect">): las fotos y la API. Conectarse recién al pedir
// la primera foto o los lugares costaba 300 a 500 ms. La API va con
// crossOrigin porque se le pide con fetch (CORS); las fotos no.
export function preconnectOrigins(apiUrl: string | undefined): { href: string; crossOrigin?: "anonymous" }[] {
  const origins: { href: string; crossOrigin?: "anonymous" }[] = [{ href: "https://res.cloudinary.com" }]
  try {
    if (apiUrl) origins.push({ href: new URL(apiUrl).origin, crossOrigin: "anonymous" })
  } catch {
    // Sin una dirección válida de la API, solo Cloudinary.
  }
  return origins
}
