"use client"

// El pronóstico de los próximos días en la página del lugar: clima y, en
// surf, olas. Se pide después de abrir la página (no la demora); si no está
// disponible, la card no aparece. Open-Meteo pide citar la fuente.
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { cardinal, dayLabel, decimal, weatherOf, type Forecast } from "@/lib/forecast"
import "./ForecastCard.css"

export default function ForecastCard({ spotId }: { spotId: number }) {
  const [forecast, setForecast] = useState<Forecast | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    api.get<Forecast>(`/spots/${spotId}/forecast`, { signal: controller.signal })
      .then(({ data }) => setForecast(data))
      // Sin pronóstico (Open-Meteo caído, lugar sin ubicación): no se muestra.
      .catch(() => {})
    return () => controller.abort()
  }, [spotId])

  if (!forecast?.days?.length) return null
  const hasWaves = forecast.days.some(d => d.waves)

  return (
    <section className="amenities-card" aria-labelledby="forecast-title">
      <div className="amenities-label">
        <div className="amenities-dot" />
        <h2 id="forecast-title" className="amenities-title">Pronóstico · próximos días</h2>
      </div>
      {/* En el celular se desliza: se puede enfocar para moverla con el teclado. */}
      <ul className="forecast-days" tabIndex={0} aria-label="Pronóstico por día">
        {forecast.days.map(day => {
          const weather = weatherOf(day.code)
          return (
            <li key={day.date} className="forecast-day hover-lift-green">
              <p className="forecast-day-name">{dayLabel(day.date)}</p>
              <p className="forecast-day-sky" title={weather.label}>
                <span aria-hidden="true">{weather.emoji}</span>
                <span className="forecast-sr">{weather.label}</span>
              </p>
              {day.max != null && day.min != null && (
                <p className="forecast-day-temp">
                  <strong>{day.max}°</strong> <span>{day.min}°</span>
                </p>
              )}
              {day.rain != null && <p className="forecast-day-fact" title="Probabilidad de lluvia">💧 {day.rain}%</p>}
              {day.wind != null && (
                <p className="forecast-day-fact" title="Viento máximo y de dónde viene">💨 {day.wind} km/h {cardinal(day.wind_dir)}</p>
              )}
              {hasWaves && (
                <p className="forecast-day-fact" title="Olas: altura, período y de dónde vienen">
                  {day.waves?.height != null
                    ? `🌊 ${decimal(day.waves.height)} m${day.waves.period != null ? ` · ${day.waves.period} s` : ""} ${cardinal(day.waves.dir)}`.trimEnd()
                    : "🌊 —"}
                </p>
              )}
            </li>
          )
        })}
      </ul>
      <p className="forecast-source">
        Datos del clima: <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo.com</a>
      </p>
    </section>
  )
}
