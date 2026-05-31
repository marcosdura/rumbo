import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/profile", "/favorites", "/agregar-lugar", "/admin"],
    },
    sitemap: "https://rumbo-eight.vercel.app/sitemap.xml",
  }
}
