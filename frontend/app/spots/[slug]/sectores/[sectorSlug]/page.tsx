import { Metadata } from "next"
import { cache } from "react"
import { notFound } from "next/navigation"
import TrailLayout, { OtherLinks, SectionCard, StatGrid } from "@/components/trail-page/TrailLayout"
import ViasTable from "@/components/trail-page/ViasTable"
import ItemPhotos from "@/components/trail-page/ItemPhotos"
import Pill from "@/components/ui/Pill"
import { AddButton } from "@/components/spot-detail/AddToSpot"
import { addToSpotUrl } from "@/components/agregar-lugar/prefill"
import { api } from "@/lib/api"
import { nullIfNotFound } from "@/lib/notFound"
import { sectorDescription } from "@/lib/metadata"
import { otherSectorFacts, sectorStats, sharePhoto, type SectorPage } from "@/lib/trailPage"
import { shareImageUrl } from "@/lib/spotDetail"
import JsonLd from "@/components/seo/JsonLd"
import { breadcrumb, pageTitle, richTitle, socialMetadata, trailJsonLd } from "@/lib/seo"

type Props = {
  params: Promise<{ slug: string; sectorSlug: string }>
}

// El sector se busca dentro de su lugar: "Sector Norte" hay en muchos.
const getSectorPage = cache(async (spotSlug: string, sectorSlug: string) =>
  nullIfNotFound(api.get<SectorPage>(`/sectors/page/${spotSlug}/${sectorSlug}`, { cache: "no-store" }).then(r => r.data)),
)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, sectorSlug } = await params
  const page = await getSectorPage(slug, sectorSlug)
  const photo = page ? sharePhoto(page.sector.photos, page.spot) : null
  const title = page
    ? richTitle(page.sector.name, { activity: "Escalada", keyword: "escalada", place: page.spot.name })
    : pageTitle(sectorSlug)
  const description = sectorDescription(page?.sector ?? null)
  const image = photo ? shareImageUrl(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, photo) : null
  return { title, description, ...socialMetadata({ title, description, path: `/spots/${slug}/sectores/${sectorSlug}`, image }) }
}

export default async function SectorPage({ params }: Props) {
  const { slug, sectorSlug } = await params
  const page = await getSectorPage(slug, sectorSlug)
  if (!page) notFound()
  const { sector, spot, routes, others } = page
  const restrictions = sector.restrictions?.trim()

  const path = `/spots/${slug}/sectores/${sectorSlug}`
  const photo = sharePhoto(sector.photos, spot)
  const ld = [
    trailJsonLd({
      name: sector.name, path, spot, description: sectorDescription(sector),
      image: photo ? shareImageUrl(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, photo) : null,
    }),
    breadcrumb([{ name: spot.name, path: `/spots/${spot.slug}` }, { name: sector.name, path }]),
  ]

  return (
    <>
    <JsonLd data={ld} />
    <TrailLayout spot={spot} eyebrow="Sector de escalada" title={sector.name}>
      {/* Las fotos primero; los datos debajo, en chico (antes eran recuadros
          grandes arriba y las fotos quedaban más abajo). */}
      <SectionCard title="Fotos del sector">
        <ItemPhotos
          photos={sector.photos} slots={sector.photo_slots} target="climbing_sector" targetId={sector.id}
          spotId={spot.id} name={sector.name}
          emptyText="Este sector todavía no tiene fotos. ¿Escalaste acá? Sumá las tuyas."
        />
      </SectionCard>
      {(sector.type || sectorStats(sector).length > 0) && (
        <div className="trail-facts">
          {sector.type && <Pill variant="green" size="lg" hover>🧗 {sector.type}</Pill>}
          <StatGrid stats={sectorStats(sector)} compact />
        </div>
      )}
      {/* Un texto que puede ser largo: aviso, no pill (como el de acceso privado). */}
      {restrictions && (
        <div role="note" style={{ background: "#fdf0f0", border: "1px solid #f5c0c0", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#7f1d1d", lineHeight: 1.5, whiteSpace: "pre-line" }}>
          ⚠️ <strong>Restricciones:</strong> {restrictions}
        </div>
      )}
      {/* Escalada es abierta: cualquiera sugiere vías (pasan por revisión). */}
      <SectionCard
        title={`Vías${routes.length ? ` — ${routes.length}` : ""}`}
        action={<AddButton href={addToSpotUrl("via", spot.id, sector.id)}>＋ Sugerir una vía</AddButton>}
      >
        <ViasTable vias={routes} spotId={spot.id} />
      </SectionCard>
      <OtherLinks
        title={`Otros sectores en ${spot.name}`}
        items={others.map(o => ({ href: `/spots/${spot.slug}/sectores/${o.slug}`, name: o.name, facts: otherSectorFacts(o) }))}
      />
    </TrailLayout>
    </>
  )
}
