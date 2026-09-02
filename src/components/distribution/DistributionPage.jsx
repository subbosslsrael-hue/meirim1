import React, { useMemo, useState } from 'react'
import {
  Plus,
  MapPin,
  Navigation,
  Route,
  CheckCircle2,
  Circle,
  Trash2,
  Pencil,
  Archive,
} from 'lucide-react'
import Card from '../shared/Card'
import Modal from '../shared/Modal'
import Field, { inputCls } from '../shared/Field'
import LoadingScreen from '../shared/LoadingScreen'
import DistributionMap from './DistributionMap'
import StopsList from './StopsList'
import { optimizeOrder, routeLengthKm } from '../../lib/route'
import { useAuth } from '../../contexts/AuthContext'
import { useDistributions } from '../../hooks/useDistributions'
import { useFamilies } from '../../hooks/useFamilies'
import { supabase } from '../../lib/supabase'

export default function DistributionPage() {
  const { profile } = useAuth()
  const distributions = useDistributions()
  const { data: families } = useFamilies()

  const [selId, setSelId] = useState(null)
  const [newOpen, setNewOpen] = useState(false)
  const [editFam, setEditFam] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deletingDist, setDeletingDist] = useState(false)
  const [showArchivePrompt, setShowArchivePrompt] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [nform, setNform] = useState({
    name: '',
    dist_date: '',
    items: '',
    familyIds: [],
  })

  const dist =
    distributions.data.find((d) => d.id === selId) || distributions.data[0]

  const ordered = useMemo(() => {
    if (!dist) return []
    return optimizeOrder(dist.stops || [])
  }, [dist])

  if (distributions.loading) return <LoadingScreen message="טוען חלוקות…" />

  const origLen = dist ? routeLengthKm(dist.stops || []) : 0
  const optLen = routeLengthKm(ordered)
  const saving = origLen > 0 ? Math.max(0, Math.round((1 - optLen / origLen) * 100)) : 0

  if (!dist) {
    return (
      <div className="space-y-4">
        <div className="text-center py-10">
          <p className="text-stone-400 mb-3">אין חלוקות מוגדרות.</p>
          {(profile?.role === 'admin' || profile?.role === 'service') && (
            <button
              onClick={() => setNewOpen(true)}
              className="bg-amber-500 text-white px-4 py-2 rounded-xl font-semibold"
            >
              + חלוקה חדשה
            </button>
          )}
        </div>
        {newOpen && (
          <NewDistributionModal
            onClose={() => setNewOpen(false)}
            onCreate={async (payload) => {
              await createDist(payload, distributions, setSelId)
            }}
            families={families}
            form={nform}
            setForm={setNform}
          />
        )}
      </div>
    )
  }

  const delivered = (dist.stops || []).filter((s) => s.delivered).length

  const canClaimRole = !!profile?.id

  const myStops = (dist.stops || []).filter(
    (s) =>
      s.claimed_by === profile?.id &&
      !s.delivered &&
      s.family?.lat != null &&
      s.family?.lng != null,
  )

  const navigateMyRoute = () => {
    if (!myStops.length) return
    const openWaze = (lat, lng) =>
      window.open(
        `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
        '_blank',
        'noopener,noreferrer',
      )
    if (myStops.length === 1 || !navigator.geolocation) {
      openWaze(myStops[0].family.lat, myStops[0].family.lng)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const me = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        let nearest = myStops[0]
        let bestDist = Infinity
        myStops.forEach((s) => {
          const d =
            (s.family.lat - me.lat) ** 2 + (s.family.lng - me.lng) ** 2
          if (d < bestDist) {
            bestDist = d
            nearest = s
          }
        })
        openWaze(nearest.family.lat, nearest.family.lng)
      },
      () => openWaze(myStops[0].family.lat, myStops[0].family.lng),
      { enableHighAccuracy: false, timeout: 5000 },
    )
  }

  const claimStop = async (stop) => {
    const next = stop.claimed_by === profile.id ? null : profile.id
    const { error } = await supabase
      .from('distribution_stops')
      .update({ claimed_by: next })
      .eq('id', stop.id)
    if (error) throw error
    await distributions.mutate()
  }

  const markDelivered = async (stop) => {
    const willBeDelivered = !stop.delivered
    const now = willBeDelivered ? new Date().toISOString() : null
    const { error } = await supabase
      .from('distribution_stops')
      .update({ delivered: willBeDelivered, delivered_at: now })
      .eq('id', stop.id)
    if (error) throw error
    await distributions.mutate()

    // כשהסימון הזה משלים את כל החלוקה — נציע למנהל/שירות לארכב.
    const isAdminOrService =
      profile?.role === 'admin' || profile?.role === 'service'
    if (willBeDelivered && isAdminOrService) {
      const stops = dist.stops || []
      const allDelivered =
        stops.length > 0 &&
        stops.every((s) => (s.id === stop.id ? true : s.delivered))
      if (allDelivered) setShowArchivePrompt(true)
    }
  }

  const photoUploaded = async (stopId, familyId, path) => {
    const { error: e1 } = await supabase
      .from('distribution_stops')
      .update({ photo_url: path })
      .eq('id', stopId)
    if (e1) throw e1
    // נסה לשמור גם על כרטיס המשפחה לחלוקות עתידיות.
    // מתנדב/מדריך אין להם UPDATE על families — נתעלם משגיאה כאן.
    const { error: e2 } = await supabase
      .from('families')
      .update({ door_photo_url: path })
      .eq('id', familyId)
    if (e2) console.warn('לא ניתן לעדכן תמונת דלת בכרטיס המשפחה:', e2.message)
    await distributions.mutate()
  }

  const deleteDistribution = async () => {
    if (!dist) return
    setDeletingDist(true)
    try {
      const { error } = await supabase
        .from('distributions')
        .delete()
        .eq('id', dist.id)
      if (error) throw error
      setSelId(null)
      setConfirmDelete(false)
      setEditFam(false)
      await distributions.mutate()
    } catch (err) {
      alert(err.message || 'שגיאה במחיקה')
    } finally {
      setDeletingDist(false)
    }
  }

  const archiveDistribution = async () => {
    if (!dist) return
    setArchiving(true)
    try {
      const { error } = await supabase.rpc('archive_distribution', {
        p_dist_id: dist.id,
      })
      if (error) throw error
      setShowArchivePrompt(false)
      setEditFam(false)
      setSelId(null)
      await distributions.mutate()
    } catch (err) {
      alert(err.message || 'שגיאה בארכוב החלוקה')
    } finally {
      setArchiving(false)
    }
  }

  const toggleFamInDist = async (family) => {
    const existing = (dist.stops || []).find((s) => s.family_id === family.id)
    if (existing) {
      const { error } = await supabase
        .from('distribution_stops')
        .delete()
        .eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('distribution_stops')
        .insert({ distribution_id: dist.id, family_id: family.id })
      if (error) throw error
    }
    await distributions.mutate()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 flex-wrap flex-1">
          {distributions.data.map((x) => (
            <button
              key={x.id}
              onClick={() => setSelId(x.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                dist.id === x.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-white border border-stone-200 text-stone-600'
              }`}
            >
              {x.name.replace('חלוקת סלי מזון – ', '')}
            </button>
          ))}
        </div>
        {(profile?.role === 'admin' || profile?.role === 'service') && (
          <button
            onClick={() => setNewOpen(true)}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-semibold shadow"
          >
            <Plus size={18} /> חלוקת חג
          </button>
        )}
      </div>

      <Card className="p-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="font-bold text-stone-800">{dist.name}</div>
          <div className="text-sm text-stone-500">
            {dist.dist_date} · {dist.items}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Navigation size={13} />
            מסלול מותאם
            {saving > 0 ? ` · ${saving}%- נסיעה` : ''}
            {optLen > 0 ? ` · ${optLen.toFixed(1)} ק״מ` : ''}
          </span>
          <span className="text-sm font-bold text-emerald-700">
            {delivered}/{(dist.stops || []).length} נמסרו
          </span>
          {canClaimRole && myStops.length > 0 && (
            <button
              onClick={navigateMyRoute}
              className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 rounded-xl font-semibold text-sm shadow"
              title="ניווט ב-Waze ליעד הקרוב ביותר מבין היעדים שלקחת"
            >
              <Navigation size={15} />
              ניווט מסלול שלי ({myStops.length})
            </button>
          )}
          {(profile?.role === 'admin' || profile?.role === 'service') && (
            <button
              onClick={() => setEditFam(true)}
              className="flex items-center gap-1.5 bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 px-3 py-1.5 rounded-xl font-semibold text-sm"
              title="הוספה/הסרה של משפחות ומחיקת החלוקה"
            >
              <Pencil size={15} />
              ערוך חלוקה
            </button>
          )}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-orange-500" />
            <h3 className="font-bold text-stone-800 text-sm">
              מפת חלוקה ומסלול מותאם (GIS אמיתי)
            </h3>
          </div>
          <DistributionMap orderedStops={ordered} />
          <div className="flex gap-4 mt-2 text-[11px] text-stone-500 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />{' '}
              נמסר
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block" />{' '}
              נלקח / בדרך
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />{' '}
              ממתין
            </span>
            <span className="flex items-center gap-1">
              <Route size={12} /> מסלול מחושב לפי השכן הקרוב
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-bold text-stone-800 text-sm mb-3">
            רשימת יעדים (לפי סדר נסיעה)
          </h3>
          <StopsList
            orderedStops={ordered}
            currentProfile={profile}
            onClaim={claimStop}
            onMarkDelivered={markDelivered}
            onPhotoUploaded={photoUploaded}
          />
        </Card>
      </div>

      {newOpen && (
        <NewDistributionModal
          onClose={() => setNewOpen(false)}
          onCreate={async (payload) => {
            await createDist(payload, distributions, setSelId)
          }}
          families={families}
          form={nform}
          setForm={setNform}
        />
      )}

      {editFam && (
        <Modal
          title={`עריכת חלוקה — ${dist.name}`}
          onClose={() => {
            setEditFam(false)
            setConfirmDelete(false)
          }}
        >
          <p className="text-xs text-stone-500 mb-3">
            הוסף או הסר משפחות. המסלול יחושב מחדש אוטומטית.
          </p>
          <div className="space-y-1.5">
            {families.map((f) => {
              const on = (dist.stops || []).some((s) => s.family_id === f.id)
              return (
                <button
                  key={f.id}
                  onClick={() => toggleFamInDist(f)}
                  className={`w-full flex items-center justify-between text-right px-3 py-2 rounded-lg text-sm ${
                    on ? 'bg-emerald-600 text-white' : 'bg-stone-50 text-stone-600'
                  }`}
                >
                  <span>
                    {f.name} · {f.city}
                    {f.door_photo_url ? ' · 📷' : ''}
                  </span>
                  {on ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Plus size={16} className="text-stone-400" />
                  )}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => {
              setEditFam(false)
              setConfirmDelete(false)
            }}
            className="w-full bg-stone-800 text-white py-2.5 rounded-xl font-semibold mt-3"
          >
            סיום
          </button>

          {(dist.stops || []).length > 0 &&
            delivered === (dist.stops || []).length && (
              <div className="mt-4 pt-4 border-t border-stone-200">
                <p className="text-xs text-stone-400 mb-2">החלוקה הושלמה</p>
                <button
                  onClick={archiveDistribution}
                  disabled={archiving}
                  className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2 rounded-lg font-semibold text-sm"
                >
                  <Archive size={15} /> ארכב חלוקה (העבר לסיכומים)
                </button>
              </div>
            )}

          <div className="mt-4 pt-4 border-t border-stone-200">
            <p className="text-xs text-stone-400 mb-2">מחיקת החלוקה</p>
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-rose-700 flex-1">
                  למחוק את החלוקה לצמיתות?
                </span>
                <button
                  onClick={deleteDistribution}
                  disabled={deletingDist}
                  className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-semibold text-sm"
                >
                  {deletingDist ? '…' : 'כן, מחק'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={deletingDist}
                  className="text-xs text-stone-500 hover:text-stone-700 px-2"
                >
                  ביטול
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 px-3 py-2 rounded-lg font-semibold text-sm"
                title="מחיקת החלוקה ללא ארכוב"
              >
                <Trash2 size={15} />
                מחק חלוקה
              </button>
            )}
          </div>
        </Modal>
      )}

      {showArchivePrompt && (
        <Modal
          title="החלוקה הושלמה 🎉"
          onClose={() => setShowArchivePrompt(false)}
        >
          <p className="text-sm text-stone-600 mb-1">
            כל המשפחות ב{dist.name} סומנו כנמסרו.
          </p>
          <p className="text-sm text-stone-600 mb-4">
            לארכב את החלוקה? היא תועבר ל״סיכומי חלוקות״ בדוחות (כולל התמונות
            והנתונים) ותוסר מהרשימה הפעילה.
          </p>
          <div className="flex gap-2">
            <button
              onClick={archiveDistribution}
              disabled={archiving}
              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold"
            >
              {archiving ? (
                '…'
              ) : (
                <>
                  <Archive size={16} /> ארכב חלוקה
                </>
              )}
            </button>
            <button
              onClick={() => setShowArchivePrompt(false)}
              disabled={archiving}
              className="px-4 bg-stone-100 hover:bg-stone-200 text-stone-600 py-2.5 rounded-xl font-semibold"
            >
              לא עכשיו
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

async function createDist(payload, distributions, setSelId) {
  const { familyIds, ...rest } = payload
  const inserted = await distributions.insert(rest)
  if (familyIds?.length) {
    const rows = familyIds.map((fid) => ({
      distribution_id: inserted.id,
      family_id: fid,
    }))
    const { error } = await supabase.from('distribution_stops').insert(rows)
    if (error) throw error
    await distributions.mutate()
  }
  setSelId(inserted.id)
}

function NewDistributionModal({ onClose, onCreate, families, form, setForm }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async () => {
    if (!form.name.trim()) {
      setError('יש להזין שם חלוקה')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onCreate(form)
      onClose()
    } catch (err) {
      setError(err.message || 'שגיאה ביצירה')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="חלוקת חג חדשה" onClose={onClose}>
      <Field label="שם החלוקה">
        <input
          className={inputCls}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="לדוגמה: חלוקת סלי מזון – חנוכה"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="תאריך">
          <input
            type="date"
            className={inputCls}
            value={form.dist_date}
            onChange={(e) => setForm({ ...form, dist_date: e.target.value })}
          />
        </Field>
        <Field label="תכולת הסל">
          <input
            className={inputCls}
            value={form.items}
            onChange={(e) => setForm({ ...form, items: e.target.value })}
            placeholder="סל מזון לחג"
          />
        </Field>
      </div>
      <Field label="בחירת משפחות לחלוקה">
        <div className="max-h-44 overflow-y-auto space-y-1.5 border border-stone-100 rounded-xl p-2">
          {families.map((f) => {
            const on = form.familyIds.includes(f.id)
            return (
              <button
                key={f.id}
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    familyIds: on
                      ? form.familyIds.filter((x) => x !== f.id)
                      : [...form.familyIds, f.id],
                  })
                }
                className={`w-full flex items-center justify-between text-right px-3 py-1.5 rounded-lg text-sm ${
                  on ? 'bg-emerald-600 text-white' : 'bg-stone-50 text-stone-600'
                }`}
              >
                <span>
                  {f.name} · {f.city}
                </span>
                {on ? (
                  <CheckCircle2 size={15} />
                ) : (
                  <Circle size={15} className="text-stone-300" />
                )}
              </button>
            )
          })}
        </div>
      </Field>
      {error && (
        <div className="text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl text-sm mb-2">
          {error}
        </div>
      )}
      <button
        onClick={submit}
        disabled={busy}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold mt-2"
      >
        {busy ? 'יוצר…' : 'יצירת חלוקה'}
      </button>
    </Modal>
  )
}
