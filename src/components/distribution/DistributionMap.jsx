import React, { useEffect, useMemo } from 'react'
import L from 'leaflet'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet'

// תיקון אייקוני ברירת מחדל ב-Leaflet עבור Vite (האייקונים הרגילים שבורים)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// שלושה מצבים: נמסר (ירוק) · נלקח/בדרך (כחול) · ממתין ולא נלקח (כתום)
// mine=יעד בסניף של הצופה (בת שירות) — מודגש בטבעת זהב ובגודל מעט גדול יותר.
function makeIcon(idx, { delivered, claimed, mine }) {
  const bg = delivered ? '#2E8B6F' : claimed ? '#0284C7' : '#D9651A'
  const size = mine ? 34 : 28
  const anchor = size / 2
  const border = mine ? '3px solid #F59E0B' : '2px solid white'
  const shadow = mine
    ? '0 0 0 3px rgba(245,158,11,.45), 0 2px 5px rgba(0,0,0,.3)'
    : '0 2px 4px rgba(0,0,0,.25)'
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${bg};color:white;
      display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:${mine ? 13 : 12}px;font-family:Assistant,sans-serif;
      border:${border};box-shadow:${shadow};
    ">${idx}</div>`,
  })
}

// מרכז את המפה אוטומטית לפי כל הסיכות
function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (!points.length) return
    if (points.length === 1) {
      map.setView(points[0], 13)
    } else {
      map.fitBounds(points, { padding: [30, 30] })
    }
  }, [map, points])
  return null
}

const SOUTH_ISRAEL_CENTER = [31.4, 34.6]

export default function DistributionMap({ orderedStops, highlightBranchId }) {
  const points = useMemo(
    () =>
      orderedStops
        .filter((s) => s.family?.lat != null && s.family?.lng != null)
        .map((s) => [s.family.lat, s.family.lng]),
    [orderedStops],
  )

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-stone-200"
      style={{ aspectRatio: '1.4' }}
    >
      <MapContainer
        center={points[0] || SOUTH_ISRAEL_CENTER}
        zoom={11}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.length > 1 && (
          <Polyline
            positions={points}
            pathOptions={{ color: '#E8920C', weight: 3, dashArray: '6 4' }}
          />
        )}
        {orderedStops
          .filter((s) => s.family?.lat != null && s.family?.lng != null)
          .map((s, idx) => {
            const claimed = !!s.claimed_by
            const mine =
              !!highlightBranchId && s.family?.branch_id === highlightBranchId
            // המצב נכלל ב-key כדי לאלץ את react-leaflet לרענן את הסיכה
            // בעת לקיחה/ביטול/מסירה (עדכון prop של icon לבדו לא תמיד תופס).
            const state = `${s.delivered ? 'd' : claimed ? 'c' : 'w'}${mine ? 'm' : ''}`
            return (
              <Marker
                key={`${s.id}-${state}`}
                position={[s.family.lat, s.family.lng]}
                icon={makeIcon(idx + 1, { delivered: s.delivered, claimed, mine })}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-bold">{s.family.name}</div>
                    <div className="text-xs text-stone-500">
                      {s.family.city}, {s.family.address}
                    </div>
                    <div className="text-xs mt-1">
                      {s.delivered
                        ? '✓ נמסר'
                        : claimed
                          ? `🧺 נלקח${s.claimer?.name ? ' · ' + s.claimer.name : ''}`
                          : '⏳ ממתין'}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        <FitBounds points={points} />
      </MapContainer>
    </div>
  )
}
