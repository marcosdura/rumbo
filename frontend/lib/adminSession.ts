import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { api } from "@/lib/api"

// ¿La sesión es la del admin? Lo decide el backend (GET /admin/blog/can-upload
// da 204 solo al admin): el email del admin no vive en el frontend.
export async function isAdminSession(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user || !session.id_token) return false
  try {
    await api.get("/admin/blog/can-upload", { token: session.id_token })
    return true
  } catch {
    return false
  }
}
