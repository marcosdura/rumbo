"use client"

// "Mis aportes": lo que sumaste a lugares publicados (antes una tarjeta del
// perfil).
import ProfileSubpage from "../ProfileSubpage"
import MyContributionsCard from "../MyContributionsCard"

export default function MyContributionsPage() {
  return (
    <ProfileSubpage title="Mis aportes">
      {token => <MyContributionsCard token={token} />}
    </ProfileSubpage>
  )
}
