// El emoji de cada categoría, el mismo en toda la app (antes cada pantalla
// tenía su lista y a alguna le faltaba Motorhome).
export const CATEGORY_EMOJI: Record<string, string> = {
  Camping: "🏕️",
  Glamping: "🛖",
  Trekking: "🥾",
  Escalada: "🧗",
  Surf: "🏄",
  Kayak: "🛶",
  Motorhome: "🚐",
}

export const categoryEmoji = (name: string | null | undefined) => (name && CATEGORY_EMOJI[name]) || "📍"
