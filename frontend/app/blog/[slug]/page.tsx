import type { Metadata } from "next"
import { cache } from "react"
import { notFound } from "next/navigation"
import BlogArticle from "@/components/blog/BlogArticle"
import Footer from "@/components/layout/Footer"
import Navbar from "@/components/layout/Navbar"
import JsonLd from "@/components/seo/JsonLd"
import { api } from "@/lib/api"
import { categoryLabel, type BlogPostData } from "@/lib/blog"
import { nullIfNotFound } from "@/lib/notFound"
import { breadcrumb, cleanText, metaDescription, pageTitle, socialMetadata } from "@/lib/seo"
import { SITE_URL } from "@/lib/site"
import { shareImageUrl } from "@/lib/spotDetail"

type Props = { params: Promise<{ slug: string }> }

// Una nota cambia poco: se vuelve a pedir cada 10 minutos.
export const revalidate = 600

// generateMetadata y la página piden la misma nota: cache() la pide una vez.
// null = no existe (o es un borrador); si falla la API, el error sigue.
const getPost = cache((slug: string) =>
  nullIfNotFound(api.get<BlogPostData>(`/blog/posts/${encodeURIComponent(slug)}`, { next: { revalidate } }).then(r => r.data)),
)

const coverUrl = (post: BlogPostData) =>
  post.cover_image ? shareImageUrl(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, post.cover_image) : undefined

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  let post: BlogPostData | null
  try {
    post = await getPost(slug)
  } catch {
    return { title: "Rumbo" }
  }
  if (!post) return { title: "Rumbo" }
  const title = pageTitle(post.title)
  const description = metaDescription(post.summary) || `${cleanText(post.title)}: una guía de Rumbo.`
  const social = socialMetadata({ title, description, path: `/blog/${slug}`, image: coverUrl(post) })
  return {
    title,
    description,
    ...social,
    openGraph: { ...social.openGraph, type: "article", publishedTime: post.published_at, ...(post.updated_at ? { modifiedTime: post.updated_at } : {}) },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const image = coverUrl(post)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: cleanText(post.title),
    description: post.summary ? cleanText(post.summary) : undefined,
    url: `${SITE_URL}/blog/${slug}`,
    ...(image ? { image } : {}),
    datePublished: post.published_at,
    dateModified: post.updated_at ?? post.published_at,
    inLanguage: "es-UY",
    author: { "@type": "Organization", name: "Rumbo", url: `${SITE_URL}/` },
    publisher: { "@type": "Organization", name: "Rumbo", logo: { "@type": "ImageObject", url: `${SITE_URL}/RumboLogo.png` } },
    ...(post.region ? { contentLocation: { "@type": "Place", name: cleanText(post.region) } } : {}),
  }

  return (
    <>
      <JsonLd data={[jsonLd, breadcrumb([
        { name: "Blog", path: "/blog" },
        { name: categoryLabel(post.category), path: `/blog?categoria=${post.category}` },
        { name: post.title, path: `/blog/${slug}` },
      ])]} />
      <Navbar />
      <main id="contenido">
        <BlogArticle post={post} />
      </main>
      <Footer />
    </>
  )
}
