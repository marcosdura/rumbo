import { notFound } from "next/navigation"
import BlogEditor from "@/components/blog/editor/BlogEditor"
import Navbar from "@/components/layout/Navbar"

// El editor de una nota del blog: /admin/blog/nueva o /admin/blog/<id>. Que
// sea el admin lo decide el backend (todo /admin/blog pide admin).
export default async function BlogEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const postId = id === "nueva" ? null : Number(id)
  if (postId !== null && !(Number.isInteger(postId) && postId > 0)) notFound()
  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0" }}>
      <Navbar />
      <main id="contenido">
        <BlogEditor key={id} postId={postId} />
      </main>
    </div>
  )
}
