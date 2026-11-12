"use client"

// "Aparece en estas guías": en la página de un lugar, las notas del blog que
// lo nombran (GET /blog/posts?spot=). Si no hay ninguna, no se ve nada.
import Link from "next/link"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { BLOG_CATEGORIES, type BlogSummary } from "@/lib/blog"
import BlogImage from "./BlogImage"

const MAX = 3

export default function SpotGuides({ spotId }: { spotId: number }) {
  const [posts, setPosts] = useState<BlogSummary[]>([])

  useEffect(() => {
    const controller = new AbortController()
    api.get<BlogSummary[]>("/blog/posts", { params: { spot: spotId }, signal: controller.signal })
      .then(({ data }) => setPosts(Array.isArray(data) ? data.slice(0, MAX) : []))
      .catch(() => {})  // sin guías, la página del lugar sigue igual
    return () => controller.abort()
  }, [spotId])

  if (posts.length === 0) return null
  return (
    <section className="spot-guides" aria-labelledby="spot-guides-title">
      <style>{`
        .spot-guides { background: #fff; border: 1px solid var(--border); border-radius: 20px; padding: 18px 20px; }
        .spot-guides h2 { font-size: 17px; margin: 0 0 4px; }
        .spot-guides > p { font-size: 13px; color: var(--muted); margin: 0 0 12px; }
        .spot-guides ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
        .spot-guide { display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit; padding: 6px; margin: -6px; border-radius: 14px; }
        .spot-guide:hover { background: #f5f4f0; }
        .spot-guide-thumb { width: 84px; height: 60px; border-radius: 10px; overflow: hidden; flex-shrink: 0; background: #e7efe9; display: grid; place-items: center; font-size: 24px; }
        .spot-guide-kind { font-size: 11px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
        .spot-guide-title { font-size: 14px; font-weight: 700; margin: 2px 0 0; color: #1b1b19; line-height: 1.3; }
      `}</style>
      <h2 id="spot-guides-title">📖 Aparece en {posts.length === 1 ? "esta guía" : "estas guías"}</h2>
      <p>Del blog de Rumbo, con mapa y consejos para ir.</p>
      <ul>
        {posts.map(p => {
          const category = BLOG_CATEGORIES.find(c => c.slug === p.category)
          return (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="spot-guide">
                <div className="spot-guide-thumb">
                  {p.cover_image ? <BlogImage id={p.cover_image} alt="" width={168} height={120} sizes="84px" /> : category?.emoji}
                </div>
                <div>
                  <p className="spot-guide-kind">{category?.emoji} {category?.label}{p.region ? ` · ${p.region}` : ""}</p>
                  <p className="spot-guide-title">{p.title}</p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
