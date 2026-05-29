import React, { useRef, useState } from 'react'
import {
  Camera,
  CheckCircle2,
  Circle,
  HandHeart,
  Image as ImageIcon,
  Navigation,
} from 'lucide-react'
import { uploadDoorPhoto } from '../../lib/storage'

function StopRow({
  stop,
  index,
  currentProfile,
  onClaim,
  onMarkDelivered,
  onPhotoUploaded,
}) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const f = stop.family || {}

  const upload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const url = await uploadDoorPhoto({ familyId: f.id, file })
      await onPhotoUploaded(stop.id, f.id, url)
    } catch (err) {
      setError(err.message || 'שגיאה בהעלאה')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const canClaim =
    currentProfile?.role === 'volunteer' || currentProfile?.role === 'instructor'

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl border border-stone-100 bg-stone-50/60">
      <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-stone-800 text-sm truncate">
          {f.name}
        </div>
        <div className="text-xs text-stone-500 truncate">
          {f.city}, {f.address}
        </div>
        {f.door_photo_url && !stop.photo_url && (
          <div className="text-[10px] text-emerald-700 flex items-center gap-1 mt-0.5">
            <ImageIcon size={11} /> תמונת דלת קיימת — חוסך זמן באיתור
          </div>
        )}
        {stop.claimer && (
          <div className="text-[10px] text-orange-700 flex items-center gap-1 mt-0.5">
            <HandHeart size={11} /> נלקח ע״י: {stop.claimer.name}
          </div>
        )}
        {error && (
          <div className="text-[10px] text-rose-600 mt-0.5">{error}</div>
        )}
      </div>

      {canClaim ? (
        <div className="flex items-center gap-1.5 shrink-0">
          {stop.claimed_by === currentProfile.id &&
            !stop.delivered &&
            f.lat != null &&
            f.lng != null && (
              <a
                href={`https://waze.com/ul?ll=${f.lat},${f.lng}&navigate=yes`}
                target="_blank"
                rel="noopener noreferrer"
                title="ניווט ב-Waze"
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-sky-500 text-white hover:bg-sky-600"
              >
                <Navigation size={14} />
                Waze
              </a>
            )}
          <button
            onClick={() => onClaim(stop)}
            disabled={stop.claimed_by && stop.claimed_by !== currentProfile.id}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
              stop.claimed_by === currentProfile.id
                ? 'bg-emerald-600 text-white'
                : stop.claimed_by
                  ? 'bg-stone-100 text-stone-400'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {stop.claimed_by === currentProfile.id
              ? '✓ אני לוקח'
              : stop.claimed_by
                ? 'תפוס'
                : 'אני אקח'}
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            title="צילום פתח-בית"
            className={`p-1.5 rounded-lg shrink-0 ${
              stop.photo_url
                ? 'bg-amber-100 text-amber-700'
                : 'bg-white text-stone-300 border border-stone-200'
            }`}
          >
            <Camera size={16} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={upload}
            className="hidden"
          />
          <button
            onClick={() => onMarkDelivered(stop)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${
              stop.delivered
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-stone-200 text-stone-500'
            }`}
          >
            {stop.delivered ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            {stop.delivered ? 'נמסר' : 'סמן'}
          </button>
        </>
      )}
    </div>
  )
}

export default function StopsList({
  orderedStops,
  currentProfile,
  onClaim,
  onMarkDelivered,
  onPhotoUploaded,
}) {
  if (!orderedStops.length) {
    return (
      <p className="text-stone-400 text-sm text-center py-4">
        אין משפחות בחלוקה. לחץ "ערוך משפחות".
      </p>
    )
  }
  return (
    <div className="space-y-2">
      {orderedStops.map((s, idx) => (
        <StopRow
          key={s.id}
          stop={s}
          index={idx}
          currentProfile={currentProfile}
          onClaim={onClaim}
          onMarkDelivered={onMarkDelivered}
          onPhotoUploaded={onPhotoUploaded}
        />
      ))}
    </div>
  )
}
