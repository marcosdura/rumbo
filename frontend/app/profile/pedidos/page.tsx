"use client"

// "Mis pedidos": cambios en tus lugares y escuelas, y pedidos para hacerte
// cargo de un lugar.
import ProfileSubpage from "../ProfileSubpage"
import MyRequestsCard from "../MyRequestsCard"

export default function MyRequestsPage() {
  return (
    <ProfileSubpage title="Mis pedidos">
      {token => <MyRequestsCard token={token} />}
    </ProfileSubpage>
  )
}
