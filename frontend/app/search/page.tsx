import { Suspense } from "react"
import SearchPageContent from "./SearchPageContent"
import LoadingScreen from "@/components/ui/LoadingScreen"

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SearchPageContent />
    </Suspense>
  )
}
