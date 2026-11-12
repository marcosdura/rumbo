import { afterEach, describe, expect, it, vi } from "vitest"

let admin = true
const revalidatePath = vi.fn()
vi.mock("@/lib/adminSession", () => ({ isAdminSession: async () => admin }))
vi.mock("next/cache", () => ({ revalidatePath: (p: string) => revalidatePath(p) }))

const { POST } = await import("./route")
const post = (body: unknown) => POST(new Request("http://x/api/blog/revalidate", { method: "POST", body: JSON.stringify(body) }))

afterEach(() => { admin = true; revalidatePath.mockClear() })

describe("refrescar el blog al guardar", () => {
  it("el inicio, el sitemap y las notas tocadas", async () => {
    expect((await post({ slugs: ["refugios", "link-viejo", "<script>"] })).status).toBe(200)
    expect(revalidatePath.mock.calls.map(c => c[0])).toEqual(["/blog", "/sitemap.xml", "/blog/refugios", "/blog/link-viejo"])
  })

  it("solo el admin", async () => {
    admin = false
    expect((await post({ slugs: ["x"] })).status).toBe(403)
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
