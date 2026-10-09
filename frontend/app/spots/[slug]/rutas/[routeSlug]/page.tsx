import { Metadata } from "next"
import { cache } from "react"
import { notFound } from "next/navigation"
import TrailLayout, { OtherLinks, SectionCard, StatGrid } from "@/components/trail-page/TrailLayout"
import ItemPhotos from "@/components/trail-page/ItemPhotos"
import RouteTrack from "@/components/trail-page/RouteTrack"
import TrekkingRouteCard from "@/components/spot-detail/TrekkingRouteCard"
import TrekkingAmenitiesCard from "@/components/spot-detail/TrekkingAmenitiesCard"
import { api } from "@/lib/api"
import { routeDescription } from "@/lib/metadata"
import { otherRouteFacts, routeStats, sharePhoto, type RoutePage } from "@/lib/trailPage"
import { shareImageUrl } from "@/lib/spotDetail"

type Props = {
  params: Promise<{ slug: string; routeSlug: string }>
}

// La ruta se busca dentro de su lugar: el slug de una ruta no es único
// entre lugares. cache(): metadata y página piden lo mismo una sola vez.
const getRoutePage = cache(async (spotSlug: string, routeSlug: string) =>
  api.get<RoutePage>(`/routes/page/${spotSlug}/${routeSlug}`, { cache: "no-store" }).then(r => r.data).catch(() => null),
)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, routeSlug } = await params
  const page = await getRoutePage(slug, routeSlug)
  const photo = page ? sharePhoto(page.route.photos, page.spot) : null
  return {
    title: `${page?.route.name ?? routeSlug} | Rumbo`,
    description: page?.route.description?.trim().slice(0, 160) || routeDescription(page?.route ?? null),
    ...(photo ? { openGraph: { images: [{ url: shareImageUrl(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, photo), width: 1200, height: 630 }] } } : {}),
  }
}

// Las características de la ruta y del lugar son componentes .jsx.
const RouteCard = TrekkingRouteCard as unknown as (p: { route: unknown }) => React.ReactElement | null
const AmenitiesCard = TrekkingAmenitiesCard as unknown as (p: { trekkingDetail: unknown }) => React.ReactElement | null

export default async function TrekkingRoutePage({ params }: Props) {
  const { slug, routeSlug } = await params
  const page = await getRoutePage(slug, routeSlug)
  if (!page) notFound()
  const { route, spot, others } = page
  const description = route.description?.trim()

  return (
    <TrailLayout spot={spot} eyebrow="Ruta de trekking" title={route.name}>
      <SectionCard title="Recorrido">
        <RouteTrack routeId={route.id} routeName={route.name} routeSlug={route.slug} track={route.track} pending={route.track_pending} />
      </SectionCard>
      <StatGrid stats={routeStats(route)} />
      <SectionCard title="Fotos">
        <ItemPhotos
          photos={route.photos} slots={route.photo_slots} target="trekking_route" targetId={route.id}
          spotId={spot.id} name={route.name}
          emptyText="Esta ruta todavía no tiene fotos. ¿La hiciste? Sumá las tuyas."
        />
      </SectionCard>
      <RouteCard route={route} />
      {description && (
        <SectionCard title="Descripción">
          <p style={{ fontSize: 15, color: "#2c2c2a", lineHeight: 1.75, margin: 0, whiteSpace: "pre-line" }}>{description}</p>
        </SectionCard>
      )}
      <AmenitiesCard trekkingDetail={spot.trekking_detail} />
      <OtherLinks
        title={`Otras rutas en ${spot.name}`}
        items={others.map(o => ({ href: `/spots/${spot.slug}/rutas/${o.slug}`, name: o.name, facts: otherRouteFacts(o) }))}
      />
    </TrailLayout>
  )
}
