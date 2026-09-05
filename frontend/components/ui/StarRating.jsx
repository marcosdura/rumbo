"use client"

import { useId, useState } from "react"

const STAR_PATH = "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"

function Star({ filled, size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "#f59e0b" : "none"}
      stroke={filled ? "#f59e0b" : "#d0cdc7"}
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={STAR_PATH} />
    </svg>
  )
}

// ─── Modo display ─────────────────────────────────────────────────────────────
// La calificación existe solo como color de relleno del SVG, así que sin
// role/aria-label un lector de pantalla no lee nada.
export function StarDisplay({ rating, size = 16 }) {
  return (
    <div
      style={{ display: "flex", gap: 2 }}
      role="img"
      aria-label={`${rating} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} filled={i <= rating} size={size} />
      ))}
    </div>
  )
}

// ─── Modo interactivo ─────────────────────────────────────────────────────────
// Radios nativos (ocultos visualmente, no con display:none, que los sacaría del
// orden de foco) envueltos en labels. Eso da gratis el Tab para entrar al
// grupo, las flechas para elegir, y el anuncio como grupo de radios con su
// estado — todo lo que antes había que hacer a mano y no estaba.
export function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  const name = useId()
  const active = hovered || value

  return (
    <div
      className="star-picker"
      role="radiogroup"
      aria-label="Calificación"
      onMouseLeave={() => setHovered(0)}
    >
      <style>{`
        .star-picker { display: flex; gap: 4px; }

        .star-picker-option {
          cursor: pointer;
          display: inline-flex;
          border-radius: 6px;
          transition: transform 0.15s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .star-picker-option.active { transform: scale(1.15); }

        /* Oculto pero enfocable: display:none o visibility:hidden lo sacarían
           del orden de tabulación y volveríamos al problema original. */
        .star-picker-input {
          position: absolute;
          width: 1px; height: 1px;
          padding: 0; margin: -1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          clip-path: inset(50%);
          white-space: nowrap;
          border: 0;
        }

        .star-picker-input:focus-visible + svg {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
          border-radius: 4px;
        }
      `}</style>

      {[1, 2, 3, 4, 5].map((i) => (
        <label
          key={i}
          className={`star-picker-option${i <= active ? " active" : ""}`}
          onMouseEnter={() => setHovered(i)}
        >
          <input
            type="radio"
            className="star-picker-input"
            name={name}
            value={i}
            checked={value === i}
            onChange={() => onChange(i)}
            aria-label={`${i} estrella${i !== 1 ? "s" : ""}`}
          />
          <Star filled={i <= active} size={28} />
        </label>
      ))}
    </div>
  )
}
