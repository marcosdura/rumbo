"use client"

interface DetailCellProps {
  label: string
  value: string
  emoji?: string
  capitalize?: boolean
}

export default function DetailCell({ label, value, emoji, capitalize }: DetailCellProps) {
  return (
    <div className="detail-cell hover-lift-green">
      <p className="detail-cell-label">{label}</p>
      <p className="detail-cell-value" style={capitalize ? { textTransform: "capitalize" } : undefined}>
        {emoji && <span>{emoji}</span>}{value}
      </p>
    </div>
  )
}
