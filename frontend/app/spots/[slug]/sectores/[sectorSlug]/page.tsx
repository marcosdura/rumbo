import { Metadata } from "next"
import { cache } from "react"
import { notFound } from "next/navigation"
import TrailLayout, { SectionCard, StatGrid } from "@/components/trail-page/TrailLayout"
import ViasTable from "@/components/trail-page/ViasTable"
import ItemPhotos from "@/components/trail-page/ItemPhotos"
import Pill from "@/components/ui/Pill"
import { AddButton } from "@/components/spot-detail/AddToSpot"
import { addToSpotUrl } from "@/components/agregar-lugar/prefill"
import { api } from "@/lib/api"
import { sectorDescription } from "@/lib/metadata"
import { sectorStats, type SectorPage } from "@/lib/trailPage"

type Props = {
  params: Promise<{ slug: string; sectorSlug: string }>
}

// El sector se busca dentro de su lugar: "Sector Norte" hay en muchos.
const getSectorPage = cache(async (spotSlug: string, sectorSlug: string) =>
  api.get<SectorPage>(`/sectors/page/${spotSlug}/${sectorSlug}`, { cache: "no-store" }).then(r => r.data).catch(() => null),
)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, sectorSlug } = await params
  const page = await getSectorPage(slug, sectorSlug)
  return {
    title: `${page?.sector.name ?? sectorSlug} | Rumbo`,
    description: sectorDescription(page?.sector ?? null),
  }
}

export default async function SectorPage({ params }: Props) {
  const { slug, sectorSlug } = await params
  const page = await getSectorPage(slug, sectorSlug)
  if (!page) notFound()
  const { sector, spot, routes } = page
  const restrictions = sector.restrictions?.trim()

  return (
    <TrailLayout spot={spot} eyebrow="Sector de escalada" title={sector.name}>
      {sector.type && (
        <div><Pill variant="green" size="lg">🧗 {sector.type}</Pill></div>
      )}
      {/* Un texto que puede ser largo: aviso, no pill (como el de acceso privado). */}
      {restrictions && (
        <div role="note" style={{ background: "#fdf0f0", border: "1px solid #f5c0c0", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#7f1d1d", lineHeight: 1.5, whiteSpace: "pre-line" }}>
          ⚠️ <strong>Restricciones:</strong> {restrictions}
        </div>
      )}
      <StatGrid stats={sectorStats(sector)} />
      <SectionCard title="Fotos del sector">
        <ItemPhotos
          photos={sector.photos} slots={sector.photo_slots} target="climbing_sector" targetId={sector.id}
          spotId={spot.id} name={sector.name}
          emptyText="Este sector todavía no tiene fotos. ¿Escalaste acá? Sumá las tuyas."
        />
      </SectionCard>
      {/* Escalada es abierta: cualquiera sugiere vías (pasan por revisión). */}
      <SectionCard
        title={`Vías${routes.length ? ` — ${routes.length}` : ""}`}
        action={<AddButton href={addToSpotUrl("via", spot.id, sector.id)}>＋ Sugerir una vía</AddButton>}
      >
        <ViasTable vias={routes} spotId={spot.id} />
      </SectionCard>
    </TrailLayout>
  )
}
