"use client"

// Una lista del panel que se pide recién cuando se abre su pestaña (antes
// eran 6 pedidos al entrar, incluidos todos los lugares con fotos). Las
// cinco listas (lugares, cambios, aportes, reportes, responsables) se
// cargaban con el mismo código repetido.
import { useEffect, useState } from "react"
import { api, ApiError } from "@/lib/api"

export const FORBIDDEN = "No tenés permisos de administrador con esta cuenta."

export function useLazyList<T>(url: string, token: string | undefined, enabled: boolean, errorMessage: string) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !enabled) return
    api.get<T[]>(url, { token })
      .then(({ data }) => { setItems(Array.isArray(data) ? data : []); setError(null) })
      .catch(e => setError(e instanceof ApiError && e.status === 403 ? FORBIDDEN : errorMessage))
      .finally(() => setLoading(false))
  }, [url, token, enabled, errorMessage])

  // Para volver a pedirla después de una acción que la cambia.
  async function refresh() {
    const { data } = await api.get<T[]>(url, { token })
    setItems(Array.isArray(data) ? data : [])
  }

  return { items, setItems, loading, error, refresh }
}
