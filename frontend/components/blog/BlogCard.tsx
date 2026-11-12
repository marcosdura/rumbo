// La tarjeta de una nota: en el inicio del blog y en "Seguí leyendo". La
// destacada es más grande (foto al costado en la compu).
import Link from "next/link"
import Pill from "@/components/ui/Pill"
import { BLOG_CATEGORIES, categoryLabel, publishedLabel, readingLabel, type BlogSummary } from "@/lib/blog"
import BlogImage from "./BlogImage"

export default function BlogCard({ post, featured = false, priority = false }: {
  post: BlogSummary; featured?: boolean; priority?: boolean
}) {
  const emoji = BLOG_CATEGORIES.find(c => c.slug === post.category)?.emoji ?? "📖"
  const meta = [publishedLabel(post.published_at), readingLabel(post.reading_minutes)].filter(Boolean).join(" · ")
  return (
    <Link href={`/blog/${post.slug}`} className={`blog-card${featured ? " is-featured" : ""}`}>
      <div className="blog-card-img">
        {post.cover_image ? (
          <BlogImage
            id={post.cover_image}
            alt={post.title}
            width={featured ? 1200 : 640}
            height={featured ? 800 : 480}
            sizes={featured ? "(max-width: 768px) 100vw, 640px" : "(max-width: 768px) 100vw, 360px"}
            priority={priority}
          />
        ) : (
          <div className="blog-card-noimg" aria-hidden="true">{emoji}</div>
        )}
      </div>
      <div className="blog-card-body">
        <div className="blog-card-pills">
          <Pill variant="green" size="sm">{emoji} {categoryLabel(post.category)}</Pill>
          {post.has_map && post.points_count > 0 && <Pill variant="white" size="sm">🗺️ {post.points_count} puntos</Pill>}
          {post.region && <Pill variant="muted" size="sm">📍 {post.region}</Pill>}
        </div>
        <h3 className="blog-card-title">{post.title}</h3>
        {post.summary && <p className="blog-card-summary">{post.summary}</p>}
        <p className="blog-card-meta">{meta}</p>
      </div>
    </Link>
  )
}
