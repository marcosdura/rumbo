import type { Metadata } from "next"
import Link from "next/link"
import BlogImage from "@/components/blog/BlogImage"
import { api } from "@/lib/api"
import { BLOG_CATEGORIES, splitFeatured, type BlogSummary } from "@/lib/blog"
import { pageTitle } from "@/lib/seo"
import "./links.css"

// El link de la bio de Instagram (@rumbo.app): una sola columna, pensada
// para el celular, con la última guía bien grande, las anteriores y lo
// principal de Rumbo. Se arma sola con las notas publicadas. Todos los links
// llevan utm (medium=bio) para verlos en Analytics. Fuera de Google: no
// tiene contenido propio.
export const metadata: Metadata = {
  title: pageTitle("Rumbo en Instagram"),
  description: "Las guías del blog de Rumbo y los lugares para salir al aire libre en Uruguay.",
  robots: { index: false, follow: true },
}

export const revalidate = 600

const utm = (path: string, campaign = "links") => {
  const [base, hash] = path.split("#")
  const sep = base.includes("?") ? "&" : "?"
  return `${base}${sep}utm_source=instagram&utm_medium=bio&utm_campaign=${campaign}${hash ? `#${hash}` : ""}`
}

const MORE = 4

export default async function LinksPage() {
  // Si el backend no contesta, la página sigue sirviendo con los links fijos.
  const posts = await api.get<BlogSummary[]>("/blog/posts", { next: { revalidate } })
    .then(r => r.data)
    .catch(() => [] as BlogSummary[])
  // La destacada (o la última) arriba; después las más nuevas.
  const { featured, rest } = splitFeatured(posts)
  const more = rest.slice(0, MORE)

  return (
    <main id="contenido" className="links">
      <header className="links-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/favicon-192.png" alt="" width={72} height={72} className="links-logo" />
        <h1>rumbo</h1>
        <p>Lugares para acampar, caminar, escalar y remar en Uruguay. Y guías con mapa para tu próxima salida.</p>
      </header>

      {featured && (
        <Link href={utm(`/blog/${featured.slug}`, featured.slug)} className="links-featured">
          <div className="links-featured-img">
            {featured.cover_image
              ? <BlogImage id={featured.cover_image} alt="" width={960} height={600} sizes="(max-width: 520px) 100vw, 480px" priority />
              : <span aria-hidden="true">{BLOG_CATEGORIES.find(c => c.slug === featured.category)?.emoji}</span>}
          </div>
          <div className="links-featured-body">
            <span className="links-kicker">Nueva guía</span>
            <strong>{featured.title}</strong>
            <span className="links-cta">Leer la guía →</span>
          </div>
        </Link>
      )}

      {more.length > 0 && (
        <ul className="links-posts" aria-label="Más guías">
          {more.map(p => (
            <li key={p.slug}>
              <Link href={utm(`/blog/${p.slug}`, p.slug)} className="links-post">
                <div className="links-post-img">
                  {p.cover_image
                    ? <BlogImage id={p.cover_image} alt="" width={160} height={160} sizes="64px" />
                    : <span aria-hidden="true">{BLOG_CATEGORIES.find(c => c.slug === p.category)?.emoji}</span>}
                </div>
                <span>{p.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <nav className="links-main" aria-label="Rumbo">
        <Link href={utm("/blog")} className="links-btn is-primary">📖 Todas las guías del blog</Link>
        <Link href={utm("/search")} className="links-btn">🔎 Buscar lugares</Link>
        <Link href={utm("/agregar-lugar")} className="links-btn">＋ Sumá tu lugar a Rumbo</Link>
      </nav>

      <footer className="links-foot">
        <a href="https://www.instagram.com/rumbo.app/" target="_blank" rel="noopener noreferrer">@rumbo.app</a>
        <span aria-hidden="true"> · </span>
        <Link href={utm("/")}>rumboapp.uy</Link>
      </footer>
    </main>
  )
}
