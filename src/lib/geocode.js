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

// חיפוש כתובות להשלמה אוטומטית (autocomplete) מתוך מאגר OSM/Nominatim.
// מחזיר עד `limit` תוצאות אמיתיות בישראל, כולל קואורדינטות — כך שכתובת
// שנבחרת מהרשימה תמיד ניתנת למיפוי. מכבד מדיניות Nominatim (יש להשהות
// בין הקלדות בצד הקורא; כאן רק בקשה בודדת).
export async function searchAddresses(query, { limit = 6, signal } = {}) {
  const q = (query || '').trim()
  if (q.length < 3) return []
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2` +
    `&addressdetails=1&countrycodes=il&limit=${limit}&q=${encodeURIComponent(q)}`
  try {
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'he' },
      signal,
    })
    if (!res.ok) return []
    const rows = await res.json()
    return rows.map((r) => {
      const a = r.address || {}
      const city =
        a.city || a.town || a.village || a.municipality || a.county || ''
      const road = a.road || a.pedestrian || a.neighbourhood || ''
      const house = a.house_number || ''
      const street = [road, house].filter(Boolean).join(' ')
      return {
        label: r.display_name,
        street: street || road || r.name || '',
        city,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      }
    })
  } catch {
    // ביטול (abort) של בקשה ישנה, או כשל רשת — מחזירים ריק בשקט.
    return []
  }
}

// חיפוש יישובים/ערים בישראל להשלמה אוטומטית של שדה העיר.
export async function searchCities(query, { limit = 6, signal } = {}) {
  const q = (query || '').trim()
  if (q.length < 2) return []
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2` +
    `&addressdetails=1&countrycodes=il&featureType=settlement` +
    `&limit=${limit}&q=${encodeURIComponent(q)}`
  try {
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'he' },
      signal,
    })
    if (!res.ok) return []
    const rows = await res.json()
    return rows
      .map((r) => {
        const a = r.address || {}
        const city =
          a.city || a.town || a.village || a.municipality || r.name || ''
        return {
          label: r.display_name,
          city,
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
        }
      })
      .filter((r) => r.city)
  } catch {
    return []
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
