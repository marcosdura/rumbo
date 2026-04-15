import { Suspense } from "react"
import SearchPageContent from "./SearchPageContent"

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <SearchPageContent />
    </Suspense>
  )
}