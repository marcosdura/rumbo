import { Metadata } from "next"
import { cache } from "react"
import { notFound } from "next/navigation"
import TrailLayout, { OtherLinks, SectionCard, StatGrid } from "@/components/trail-page/TrailLayout"
import ItemPhotos from "@/components/trail-page/ItemPhotos"
import RouteTrack from "@/components/trail-page/RouteTrack"
import TrekkingRouteTraits from "@/components/spot-detail/TrekkingRouteTraits"
import TrekkingAmenitiesCard from "@/components/spot-detail/TrekkingAmenitiesCard"
import { api } from "@/lib/api"
import { nullIfNotFound } from "@/lib/notFound"
import { routeDescription } from "@/lib/metadata"
import { otherRouteFacts, routeStats, sharePhoto, type RoutePage } from "@/lib/trailPage"
import { shareImageUrl } from "@/lib/spotDetail"
import JsonLd from "@/components/seo/JsonLd"
import { breadcrumb, metaDescription, pageTitle, richTitle, socialMetadata, trailJsonLd } from "@/lib/seo"

type Props = {
  params: Promise<{ slug: string; routeSlug: string }>
}

// La ruta se busca dentro de su lugar: el slug de una ruta no es único
// entre lugares. cache(): metadata y página piden lo mismo una sola vez.
const getRoutePage = cache(async (spotSlug: string, routeSlug: string) =>
  nullIfNotFound(api.get<RoutePage>(`/routes/page/${spotSlug}/${routeSlug}`, { cache: "no-store" }).then(r => r.data)),
)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, routeSlug } = await params
  const page = await getRoutePage(slug, routeSlug)
  const photo = page ? sharePhoto(page.route.photos, page.spot) : null
  const title = page
    ? richTitle(page.route.name, { activity: "Trekking", keyword: "trekking", place: page.spot.name })
    : pageTitle(routeSlug)
  const description = metaDescription(page?.route.description) || routeDescription(page?.route ?? null)
  const image = photo ? shareImageUrl(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, photo) : null
  return { title, description, ...socialMetadata({ title, description, path: `/spots/${slug}/rutas/${routeSlug}`, image }) }
}

// Las características de la ruta y del lugar son componentes .jsx.
const RouteTraits = TrekkingRouteTraits as unknown as (p: { route: unknown }) => React.ReactNode
const AmenitiesCard = TrekkingAmenitiesCard as unknown as (p: { trekkingDetail: unknown; title?: string }) => React.ReactElement | null

export default async function TrekkingRoutePage({ params }: Props) {
  const { slug, routeSlug } = await params
  const page = await getRoutePage(slug, routeSlug)
  if (!page) notFound()
  const { route, spot, others } = page
  const description = route.description?.trim()

  const path = `/spots/${slug}/rutas/${routeSlug}`
  const photo = sharePhoto(route.photos, spot)
  const ld = [
    trailJsonLd({
      name: route.name, path, spot,
      description: metaDescription(description) || routeDescription(route),
      image: photo ? shareImageUrl(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, photo) : null,
    }),
    breadcrumb([{ name: spot.name, path: `/spots/${spot.slug}` }, { name: route.name, path }]),
  ]

  return (
    <>
    <JsonLd data={ld} />
    <TrailLayout spot={spot} eyebrow="Ruta de trekking" title={route.name}>
      {/* Las fotos primero; debajo, todos los datos juntos en pills (como el
          sector de escalada): antes eran recuadros grandes y las
          características iban en otra tarjeta, más abajo. */}
      <SectionCard title="Fotos">
        <ItemPhotos
          photos={route.photos} slots={route.photo_slots} target="trekking_route" targetId={route.id}
          spotId={spot.id} name={route.name}
          emptyText="Esta ruta todavía no tiene fotos. ¿La hiciste? Sumá las tuyas."
        />
      </SectionCard>
      <div className="trail-facts">
        <StatGrid stats={routeStats(route)} compact />
        <RouteTraits route={route} />
      </div>
      <SectionCard title="Recorrido">
        <RouteTrack routeId={route.id} routeName={route.name} routeSlug={route.slug} track={route.track} pending={route.track_pending} />
      </SectionCard>
      {description && (
        <SectionCard title="Descripción">
          <p style={{ fontSize: 15, color: "#2c2c2a", lineHeight: 1.75, margin: 0, whiteSpace: "pre-line" }}>{description}</p>
        </SectionCard>
      )}
      <AmenitiesCard trekkingDetail={spot.trekking_detail} title={`Características de ${spot.name}`} />
      <OtherLinks
        title={`Otras rutas en ${spot.name}`}
        items={others.map(o => ({ href: `/spots/${spot.slug}/rutas/${o.slug}`, name: o.name, facts: otherRouteFacts(o) }))}
      />
    </TrailLayout>
    </>
  )
}
