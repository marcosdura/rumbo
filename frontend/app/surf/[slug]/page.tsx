import { redirectToSpot } from "@/lib/legacyService"

type Props = {
  params: Promise<{ slug: string }>
}

// Dirección vieja: lleva al lugar (lib/legacyService.ts).
export default async function OldPage({ params }: Props) {
  const { slug } = await params
  return redirectToSpot("surf", slug)
}
