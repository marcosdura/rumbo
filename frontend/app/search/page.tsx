import type { Metadata } from "next"
import { Suspense } from "react"
import SearchPageContent from "./SearchPageContent"
import LoadingScreen from "@/components/ui/LoadingScreen"
import { searchMetadata } from "@/lib/places"

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return searchMetadata(await searchParams)
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SearchPageContent />
    </Suspense>
  )
}
