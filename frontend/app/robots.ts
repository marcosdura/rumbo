import { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"
import { PRIVATE_SECTIONS } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Antes faltaban /dashboard, /reviews y /notificaciones.
      disallow: PRIVATE_SECTIONS,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
