"use client"

// Las notas del blog en el panel de admin: borradores y publicadas, la
// última tocada primero. Cada una abre el editor (/admin/blog/<id>).
import Link from "next/link"
import { useEffect, useState } from "react"
import BlogImage from "@/components/blog/BlogImage"
import { api, ApiError } from "@/lib/api"
import { categoryLabel, publishedLabel } from "@/lib/blog"
import type { AdminBlogRow } from "@/lib/blogEditor"
import { FORBIDDEN } from "./useLazyList"

export default function BlogTab({ token }: { token: string | undefined }) {
  const [posts, setPosts] = useState<AdminBlogRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    api.get<AdminBlogRow[]>("/admin/blog/posts", { token })
      .then(({ data }) => setPosts(data))
      .catch(e => setError(e instanceof ApiError && e.status === 403 ? FORBIDDEN : "No se pudieron cargar las notas."))
  }, [token])

  return (
    <div className="admin-blog">
      <style>{`
        .admin-blog-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
        .admin-blog-new { padding: 9px 18px; border-radius: 12px; background: var(--primary); color: #fff; font-weight: 600; font-size: 13px; text-decoration: none; }
        .admin-blog-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
        .admin-blog-row { display: flex; align-items: center; gap: 14px; background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 10px 14px; text-decoration: none; color: inherit; }
        .admin-blog-row:hover { border-color: var(--primary); }
        .admin-blog-thumb { width: 72px; height: 48px; border-radius: 10px; overflow: hidden; background: #eceae3; flex-shrink: 0; display: grid; place-items: center; font-size: 20px; }
        .admin-blog-info { flex: 1; min-width: 0; }
        .admin-blog-title { margin: 0; font-weight: 700; font-size: 14px; color: #1b1b19; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .admin-blog-meta { margin: 2px 0 0; font-size: 12px; color: var(--muted); }
        .admin-blog-status { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; white-space: nowrap; }
        .admin-blog-status.is-published { background: #e3f2e9; color: #1f5135; }
        .admin-blog-status.is-draft { background: #fff4d6; color: #6b4e06; }
        .admin-blog-empty { background: #fff; border: 1px dashed var(--border); border-radius: 16px; padding: 28px; text-align: center; color: var(--muted); font-size: 14px; }
      `}</style>
      <div className="admin-blog-top">
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
          Las publicadas están en <a href="/blog" target="_blank" rel="noreferrer">/blog</a>. Los borradores solo se ven acá.
        </p>
        <Link href="/admin/blog/nueva" className="admin-blog-new">+ Nueva nota</Link>
      </div>
      {error && <p role="alert" style={{ color: "#9b1c1c", fontSize: 14 }}>{error}</p>}
      {!error && posts === null && <p style={{ color: "var(--muted)", fontSize: 14 }}>Cargando…</p>}
      {posts?.length === 0 && (
        <p className="admin-blog-empty">Todavía no hay notas. Arrancá con «+ Nueva nota».</p>
      )}
      {posts && posts.length > 0 && (
        <ul className="admin-blog-list">
          {posts.map(p => (
            <li key={p.id}>
              <Link href={`/admin/blog/${p.id}`} className="admin-blog-row">
                <div className="admin-blog-thumb">
                  {p.cover_image ? <BlogImage id={p.cover_image} alt="" width={144} height={96} sizes="72px" /> : "📝"}
                </div>
                <div className="admin-blog-info">
                  <p className="admin-blog-title">{p.featured ? "⭐ " : ""}{p.title}</p>
                  <p className="admin-blog-meta">
                    {[
                      categoryLabel(p.category),
                      p.status === "published" && p.published_at ? `publicada el ${publishedLabel(p.published_at)}` : null,
                      p.points_count ? `${p.points_count} puntos` : null,
                      `/blog/${p.slug}`,
                    ].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className={`admin-blog-status is-${p.status}`}>{p.status === "published" ? "Publicada" : "Borrador"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
