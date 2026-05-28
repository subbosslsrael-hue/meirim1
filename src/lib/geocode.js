// המרת כתובת לקואורדינטות באמצעות Nominatim של OSM (חינמי, בלי מפתח)
// שימוש מוגבל: עד בקשה אחת לשנייה. כללי השימוש: https://operations.osmfoundation.org/policies/nominatim/

export async function geocodeAddress({ city, address, country = 'Israel' }) {
  const query = [address, city, country].filter(Boolean).join(', ')
  if (!query.trim()) return null
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=il&q=${encodeURIComponent(query)}`
  try {
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'he' },
    })
    if (!res.ok) return null
    const rows = await res.json()
    if (!rows.length) return null
    return {
      lat: parseFloat(rows[0].lat),
      lng: parseFloat(rows[0].lon),
      display: rows[0].display_name,
    }
  } catch (err) {
    console.warn('geocode error:', err)
    return null
  }
}

// קואורדינטות ברירת מחדל לערים בדרום — אם geocode נכשל
export const CITY_FALLBACK = {
  שדרות: { lat: 31.5246, lng: 34.5957 },
  נתיבות: { lat: 31.4214, lng: 34.5878 },
  אופקים: { lat: 31.3140, lng: 34.6203 },
  אשקלון: { lat: 31.6688, lng: 34.5715 },
  'באר שבע': { lat: 31.2518, lng: 34.7913 },
}

export function fallbackForCity(city) {
  if (!city) return null
  for (const k of Object.keys(CITY_FALLBACK)) {
    if (city.includes(k) || k.includes(city)) return CITY_FALLBACK[k]
  }
  return null
}
