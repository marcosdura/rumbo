# Ideas para Rumbo

Ideas que salieron de la segunda auditoría (21/10/2026). Ninguna está decidida
ni empezada: son para evaluar. Cada una dice qué haría falta y con qué choca.

## Cerca mío

Ordenar los lugares por distancia a donde está la persona.

- Pedir la ubicación del dispositivo con permiso explícito, solo al tocar
  "Cerca mío" (nunca al abrir la página).
- Hoy está bloqueada a propósito: `Permissions-Policy: geolocation=()` en
  `frontend/lib/securityHeaders.ts`, y la política de privacidad dice "No
  usamos la ubicación de tu dispositivo". Habría que cambiar las dos cosas.
- La ubicación no tiene por qué salir del navegador: con las coordenadas de
  los lugares (`/spots/pins`) se puede ordenar ahí mismo.

## Pronóstico en el lugar

El clima de los próximos días en la página del lugar, y olas y viento en surf
y kayak.

- Open-Meteo es gratis y sin clave (pronóstico y marino).
- Se pide por las coordenadas del lugar; se puede cachear por hora.

## Condiciones recientes

"¿Cómo estaba?": un comentario corto con fecha (barro, agua, camino cortado,
mucha gente), separado de las reseñas.

- Vence solo (por ejemplo, a las dos semanas deja de mostrarse).
- Complementa la "Última actualización", que habla de la información del
  lugar y no del estado de hoy.

## Listas propias

Armar y compartir una lista de lugares ("finde en Rocha", "para ir con
niños").

- Sobre los favoritos que ya existen: una lista es un nombre más un grupo de
  favoritos.
- Link público de solo lectura para compartir.

## Avisos push de la PWA

Avisar sin abrir la app (aporte aprobado, reseña nueva en tu lugar).

- Ya evaluado en la primera auditoría: es viable sin servicios pagos, con un
  service worker propio (`public/sw.js`) y claves VAPID.
- Hoy las notificaciones son solo dentro de la app.

## Importar rutas de trekking desde una planilla

Como el importador de vías del panel de admin, para cargar un lugar con
muchas rutas de una vez (nombre, distancia, duración, desnivel, dificultad).
