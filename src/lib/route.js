// אלגוריתם השכן הקרוב לחישוב מסלול מהיר על קואורדינטות גיאוגרפיות
// משתמש במרחק "הברדישף" (Haversine) במטרים — מספיק טוב לדרום ישראל

function haversine(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return Infinity
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

export function optimizeOrder(stops) {
  const withCoords = stops.filter(
    (s) => s.family?.lat != null && s.family?.lng != null,
  )
  if (withCoords.length <= 2) return [...withCoords, ...stops.filter((s) => s.family?.lat == null)]
  const remaining = [...withCoords]
  const route = [remaining.shift()]
  while (remaining.length) {
    const last = route[route.length - 1].family
    let bestIdx = 0
    let bestDist = Infinity
    remaining.forEach((s, i) => {
      const d = haversine(last, s.family)
      if (d < bestDist) {
        bestDist = d
        bestIdx = i
      }
    })
    route.push(remaining.splice(bestIdx, 1)[0])
  }
  const noCoords = stops.filter((s) => s.family?.lat == null)
  return [...route, ...noCoords]
}

export function routeLengthKm(stops) {
  let total = 0
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1].family
    const b = stops[i].family
    if (a?.lat != null && b?.lat != null) total += haversine(a, b)
  }
  return total / 1000
}
