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

function makeIcon(idx, delivered) {
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${delivered ? '#2E8B6F' : '#D9651A'};color:white;
      display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:12px;font-family:Assistant,sans-serif;
      border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.25);
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

export default function DistributionMap({ orderedStops }) {
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
          .map((s, idx) => (
            <Marker
              key={s.id}
              position={[s.family.lat, s.family.lng]}
              icon={makeIcon(idx + 1, s.delivered)}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold">{s.family.name}</div>
                  <div className="text-xs text-stone-500">
                    {s.family.city}, {s.family.address}
                  </div>
                  <div className="text-xs mt-1">
                    {s.delivered ? '✓ נמסר' : '⏳ ממתין'}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        <FitBounds points={points} />
      </MapContainer>
    </div>
  )
}
