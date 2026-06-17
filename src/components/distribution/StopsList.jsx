import React, { useRef, useState } from 'react'
import {
  Camera,
  CheckCircle2,
  Circle,
  HandHeart,
  Image as ImageIcon,
  Navigation,
  X,
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
  const [viewing, setViewing] = useState(false)
  const f = stop.family || {}
  const photoUrl = stop.photo_url || f.door_photo_url

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

  const claimedByMe = stop.claimed_by === currentProfile?.id
  const isAdminOrService =
    currentProfile?.role === 'admin' || currentProfile?.role === 'service'
  const canModify = isAdminOrService || claimedByMe

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
          <button
            type="button"
            onClick={() => setViewing(true)}
            className="text-[10px] text-emerald-700 flex items-center gap-1 mt-0.5 hover:underline"
          >
            <ImageIcon size={11} /> תמונת דלת קיימת — לחץ לצפייה
          </button>
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

      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
        {claimedByMe && !stop.delivered && f.lat != null && f.lng != null && (
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
          disabled={stop.claimed_by && !claimedByMe && !isAdminOrService}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
            claimedByMe
              ? 'bg-emerald-600 text-white'
              : stop.claimed_by
                ? 'bg-stone-100 text-stone-400'
                : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          {claimedByMe
            ? '✓ אני לוקח'
            : stop.claimed_by
              ? 'תפוס'
              : 'אני אקח'}
        </button>
        {photoUrl && (
          <button
            type="button"
            onClick={() => setViewing(true)}
            title="צפייה בתמונה"
            className="w-9 h-9 rounded-lg overflow-hidden border border-stone-200 shrink-0"
          >
            <img
              src={photoUrl}
              alt="תמונת דלת"
              className="w-full h-full object-cover"
            />
          </button>
        )}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy || !canModify}
          title={
            !canModify
              ? 'יש לתפוס את היעד תחילה'
              : photoUrl
                ? 'החלף תמונה'
                : 'צילום פתח-בית'
          }
          className={`p-1.5 rounded-lg ${
            photoUrl
              ? 'bg-amber-100 text-amber-700'
              : 'bg-white text-stone-300 border border-stone-200'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
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
          disabled={!canModify}
          title={canModify ? '' : 'יש לתפוס את היעד תחילה'}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
            stop.delivered
              ? 'bg-emerald-600 text-white'
              : 'bg-white border border-stone-200 text-stone-500'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {stop.delivered ? <CheckCircle2 size={14} /> : <Circle size={14} />}
          {stop.delivered ? 'נמסר' : 'סמן'}
        </button>
      </div>

      {viewing && photoUrl && (
        <div
          className="fixed inset-0 z-[2000] bg-black/80 flex flex-col items-center justify-center p-4"
          onClick={() => setViewing(false)}
        >
          <div
            className="relative max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2 text-white">
              <span className="font-semibold text-sm truncate">
                תמונת דלת — {f.name}
              </span>
              <button
                type="button"
                onClick={() => setViewing(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20"
              >
                <X size={18} />
              </button>
            </div>
            <img
              src={photoUrl}
              alt="תמונת דלת"
              className="w-full max-h-[75vh] object-contain rounded-xl bg-stone-900"
            />
            {canModify && (
              <button
                type="button"
                onClick={() => {
                  setViewing(false)
                  fileRef.current?.click()
                }}
                disabled={busy}
                className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-40"
              >
                <Camera size={16} /> החלף תמונה
              </button>
            )}
          </div>
        </div>
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
