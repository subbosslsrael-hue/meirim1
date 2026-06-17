import React, { useEffect, useRef, useState } from 'react'
import {
  Camera,
  CheckCircle2,
  Circle,
  HandHeart,
  Image as ImageIcon,
  Loader2,
  Navigation,
  X,
} from 'lucide-react'
import { getDoorPhotoUrl, uploadDoorPhoto } from '../../lib/storage'

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
  // הנתיב השמור (של החלוקה הנוכחית, ואם אין — של כרטיס המשפחה).
  const photoKey = stop.photo_url || f.door_photo_url
  // קישור חתום זמני שמיוצר לצפייה; הבאקט פרטי.
  const [displayUrl, setDisplayUrl] = useState(null)
  const [urlLoading, setUrlLoading] = useState(false)

  useEffect(() => {
    let active = true
    if (!photoKey) {
      setDisplayUrl(null)
      setUrlLoading(false)
      return
    }
    setUrlLoading(true)
    getDoorPhotoUrl(photoKey).then((u) => {
      if (active) {
        setDisplayUrl(u)
        setUrlLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [photoKey])

  const upload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const path = await uploadDoorPhoto({ familyId: f.id, file })
      await onPhotoUploaded(stop.id, f.id, path)
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
        {stop.claimer && (
          <div className="text-[10px] text-orange-700 flex items-center gap-1 mt-0.5">
            <HandHeart size={11} /> נלקח ע״י: {stop.claimer.name}
          </div>
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
        <button
          type="button"
          onClick={() => setViewing(true)}
          title="תמונת דלת"
          className={`w-9 h-9 rounded-lg overflow-hidden border shrink-0 flex items-center justify-center ${
            photoKey
              ? 'border-amber-200 bg-amber-50 text-amber-600'
              : 'border-stone-200 bg-white text-stone-400'
          }`}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="תמונת דלת"
              className="w-full h-full object-cover"
            />
          ) : urlLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Camera size={16} />
          )}
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

      {viewing && (
        <div
          className="fixed inset-0 z-[2000] bg-black/80 flex flex-col items-center justify-center p-4"
          onClick={() => !busy && setViewing(false)}
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
                disabled={busy}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            {busy ? (
              <div className="bg-stone-900 rounded-xl py-16 flex flex-col items-center justify-center gap-3 text-white">
                <Loader2 size={28} className="animate-spin" />
                <span className="text-sm">מעלה תמונה…</span>
              </div>
            ) : displayUrl ? (
              <img
                src={displayUrl}
                alt="תמונת דלת"
                className="w-full max-h-[70vh] object-contain rounded-xl bg-stone-900"
              />
            ) : urlLoading ? (
              <div className="bg-stone-900 rounded-xl py-16 flex flex-col items-center justify-center gap-3 text-white">
                <Loader2 size={28} className="animate-spin" />
                <span className="text-sm">טוען תמונה…</span>
              </div>
            ) : photoKey ? (
              <div className="bg-stone-900 rounded-xl py-12 flex flex-col items-center justify-center gap-2 text-stone-300 text-center px-4">
                <ImageIcon size={28} />
                <span className="text-sm">לא ניתן לטעון את התמונה</span>
              </div>
            ) : (
              <div className="bg-stone-900 rounded-xl py-12 flex flex-col items-center justify-center gap-2 text-stone-300 text-center px-4">
                <Camera size={28} />
                <span className="text-sm">אין עדיין תמונת דלת ליעד זה</span>
              </div>
            )}

            {error && (
              <div className="mt-3 text-sm text-rose-200 bg-rose-950/50 border border-rose-800 rounded-lg px-3 py-2 text-center">
                {error}
              </div>
            )}

            {canModify ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-40"
              >
                <Camera size={16} /> {photoKey ? 'החלף תמונה' : 'העלה תמונה'}
              </button>
            ) : (
              !photoKey && (
                <div className="mt-3 text-center text-stone-400 text-xs">
                  יש לתפוס את היעד כדי להעלות תמונה
                </div>
              )
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
