"use client"

// El inicio del blog: la nota destacada arriba, los filtros por categoría y
// la grilla con el resto. Filtrar no vuelve a pedir nada: las notas ya
// vinieron todas. La categoría queda en el link (/blog?categoria=rutas)
// para poder compartirla desde Instagram; la primera la lee la página en el
// servidor, así Google y quien entra ven las notas sin esperar.
import { useState } from "react"
import { BLOG_CATEGORIES, splitFeatured, type BlogCategory, type BlogSummary } from "@/lib/blog"
import BlogCard from "./BlogCard"
import "./blog.css"

export default function BlogHome({ posts, initialCategory = null }: { posts: BlogSummary[]; initialCategory?: BlogCategory | null }) {
  const [active, setActive] = useState<BlogCategory | null>(initialCategory)

  const counts = new Map<string, number>()
  for (const p of posts) counts.set(p.category, (counts.get(p.category) ?? 0) + 1)
  const categories = BLOG_CATEGORIES.filter(c => counts.has(c.slug))

  const visible = active ? posts.filter(p => p.category === active) : posts
  // Con un filtro puesto no hay destacada: todas iguales.
  const { featured, rest } = active ? { featured: null, rest: visible } : splitFeatured(visible)

  function choose(slug: BlogCategory | null) {
    setActive(slug)
    // Sin navegar: solo el link, para copiarlo y compartirlo.
    window.history.replaceState(window.history.state, "", slug ? `/blog?categoria=${slug}` : "/blog")
  }

  return (
    <div className="blog-page blog-home">
      <header className="blog-home-header">
        <p className="blog-kicker">Blog de Rumbo</p>
        <h1 className="blog-home-title">Rutas, refugios y consejos para salir al aire libre</h1>
        <p className="blog-home-intro">Guías con mapa para armar tu próxima salida, en Uruguay y más allá.</p>
      </header>

      {categories.length > 1 && (
        <div className="blog-filters" role="toolbar" aria-label="Filtrar por categoría">
          <button type="button" className={`blog-filter${active ? "" : " is-on"}`} aria-pressed={!active} onClick={() => choose(null)}>
            Todas <span>{posts.length}</span>
          </button>
          {categories.map(c => (
            <button
              key={c.slug}
              type="button"
              className={`blog-filter${active === c.slug ? " is-on" : ""}`}
              aria-pressed={active === c.slug}
              onClick={() => choose(c.slug)}
            >
              {c.emoji} {c.label} <span>{counts.get(c.slug)}</span>
            </button>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <p className="blog-empty">Muy pronto, las primeras notas. Mientras tanto, seguinos en <a href="https://www.instagram.com/rumbo.app/" target="_blank" rel="noopener noreferrer">Instagram</a>.</p>
      ) : (
        <>
          {featured && <BlogCard post={featured} featured priority />}
          {rest.length > 0 && (
            <div className="blog-grid">
              {rest.map(p => <BlogCard key={p.slug} post={p} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}
