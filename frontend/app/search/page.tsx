import type { Metadata } from "next"
import { Suspense } from "react"
import SearchPageContent, { type InitialResults } from "./SearchPageContent"
import LoadingScreen from "@/components/ui/LoadingScreen"
import { api } from "@/lib/api"
import { searchMetadata } from "@/lib/places"
import { listQuery, toSearchParams } from "@/lib/searchFilters"
import type { SpotListItem } from "@/lib/types"

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return searchMetadata(await searchParams)
}

// La primera tanda de lugares viene con la página (antes la pedía el
// navegador después de cargar todo). Si el backend falla acá, la página
// sale igual y la pide el navegador, que sabe mostrar el error y reintentar.
async function firstResults(params: URLSearchParams): Promise<InitialResults | null> {
  try {
    const { data, totalCount } = await api.get<SpotListItem[]>(`/spots?${listQuery(params)}`, { next: { revalidate: 60 } })
    return { query: params.toString(), spots: data, total: totalCount ?? data.length }
  } catch {
    return null
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const initial = await firstResults(toSearchParams(await searchParams))
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SearchPageContent initial={initial} />
    </Suspense>
  )
}
