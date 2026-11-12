import type { Metadata } from "next"
import BlogHome from "@/components/blog/BlogHome"
import Footer from "@/components/layout/Footer"
import Navbar from "@/components/layout/Navbar"
import JsonLd from "@/components/seo/JsonLd"
import { api } from "@/lib/api"
import { asCategory, type BlogSummary } from "@/lib/blog"
import { breadcrumb, socialMetadata } from "@/lib/seo"
import { SITE_URL } from "@/lib/site"

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const TITLE = "Blog de Rumbo: rutas, refugios y consejos"
const DESCRIPTION = "Guías con mapa para tu próxima salida: rutas de trekking, travesías de refugios, campings y consejos para acampar, en Uruguay y la región."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...socialMetadata({ title: TITLE, description: DESCRIPTION, path: "/blog" }),
}

// Si el backend falla, el error sigue hasta app/error.tsx (como los lugares).
export default async function BlogPage({ searchParams }: Props) {
  const { data: posts } = await api.get<BlogSummary[]>("/blog/posts", { next: { revalidate: 600 } })
  const initialCategory = asCategory((await searchParams).categoria)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog de Rumbo",
    description: DESCRIPTION,
    url: `${SITE_URL}/blog`,
    inLanguage: "es-UY",
    blogPost: posts.slice(0, 20).map(p => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${SITE_URL}/blog/${p.slug}`,
      datePublished: p.published_at,
    })),
  }
  return (
    <>
      <JsonLd data={[jsonLd, breadcrumb([{ name: "Blog", path: "/blog" }])]} />
      <Navbar />
      <main id="contenido">
        <BlogHome posts={posts} initialCategory={initialCategory} />
      </main>
      <Footer />
    </>
  )
}
