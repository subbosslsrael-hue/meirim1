import React, { useState } from 'react'
import {
  Plus,
  Search,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react'
import FamilyCard from './FamilyCard'
import FamilyForm from './FamilyForm'
import ImportFromExcel from './ImportFromExcel'
import ChangeoverModal from './ChangeoverModal'
import LoadingScreen from '../shared/LoadingScreen'
import { useAuth } from '../../contexts/AuthContext'
import { useFamilies } from '../../hooks/useFamilies'
import { useBranches } from '../../hooks/useBranches'
import { useProfiles } from '../../hooks/useProfiles'
import { supabase } from '../../lib/supabase'

export default function FamiliesPage() {
  const { profile } = useAuth()
  const families = useFamilies()
  const { data: branches } = useBranches()
  const { data: profiles } = useProfiles()

  const [q, setQ] = useState('')
  const [openAdd, setOpenAdd] = useState(false)
  const [openSwap, setOpenSwap] = useState(false)
  const [editFamily, setEditFamily] = useState(null)
  const [toast, setToast] = useState(null)

  if (families.loading) return <LoadingScreen message="טוען משפחות…" />

  // ה-RLS כבר מסנן בשרת, אבל גם בקליינט נחפש לפי טקסט
  const filtered = families.data.filter((f) =>
    [f.name, f.city, f.address, f.need_category].join(' ').includes(q),
  )

  const assignToMe = async (familyId) => {
    try {
      await families.update(familyId, { responsible_profile_id: profile.id })
      setToast({ kind: 'ok', message: 'שובצת כאחראית למשפחה זו.' })
    } catch (err) {
      setToast({ kind: 'err', message: err.message || 'שגיאה בשיוך' })
    }
  }

  const handleAdd = async (family) => {
    await families.insert(family)
    setToast({ kind: 'ok', message: 'המשפחה נוספה למאגר.' })
  }

  const handleUpdate = async (patch) => {
    await families.update(editFamily.id, patch)
    setToast({ kind: 'ok', message: 'פרטי המשפחה עודכנו.' })
  }

  const handleDelete = async (familyId) => {
    await families.remove(familyId)
    setToast({ kind: 'ok', message: 'המשפחה הוסרה מהמאגר.' })
  }

  const handleImport = async (rows) => {
    const { error } = await supabase.from('families').insert(rows)
    if (error) throw error
    await families.mutate()
  }

  const handleSwap = async ({ fromId, toId }) => {
    const toMove = families.data.filter((f) => f.responsible_profile_id === fromId)
    if (!toMove.length) return 0
    const { error } = await supabase
      .from('families')
      .update({ responsible_profile_id: toId })
      .eq('responsible_profile_id', fromId)
    if (error) throw error
    await families.mutate()
    return toMove.length
  }

  const onCloseSwap = (result) => {
    setOpenSwap(false)
    if (result?.count) {
      setToast({
        kind: 'ok',
        message: `בוצע חילוף: ${result.count} משפחות הועברו מ${result.fromName} ל${result.toName}.`,
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש משפחה / עיר / סוג צורך…"
            className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-stone-200 bg-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
        </div>
        <button
          onClick={() => setOpenAdd(true)}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow"
        >
          <Plus size={18} /> משפחה
        </button>
        <ImportFromExcel
          branches={branches}
          profiles={profiles}
          onImport={handleImport}
          onResult={(r) =>
            setToast(
              r.error
                ? { kind: 'err', message: r.message || 'הייבוא נכשל' }
                : {
                    kind: 'ok',
                    message: `יובאו ${r.count} משפחות ושויכו אוטומטית.`,
                  },
            )
          }
        />
        {profile?.role === 'admin' && (
          <button
            onClick={() => setOpenSwap(true)}
            className="flex items-center gap-1.5 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 px-4 py-2.5 rounded-xl font-semibold shadow-sm"
          >
            <UserCheck size={18} /> חילוף אחראית
          </button>
        )}
      </div>

      {toast && (
        <div
          className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium ${
            toast.kind === 'err'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          <span className="flex items-center gap-2">
            {toast.kind === 'err' ? (
              <AlertTriangle size={16} />
            ) : (
              <CheckCircle2 size={16} />
            )}
            {toast.message}
          </span>
          <button
            onClick={() => setToast(null)}
            className="opacity-60 hover:opacity-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((f) => (
          <FamilyCard
            key={f.id}
            family={f}
            currentProfile={profile}
            onAssignToMe={assignToMe}
            onEdit={setEditFamily}
          />
        ))}
        {filtered.length === 0 && (
          <p className="text-stone-400 text-sm col-span-full text-center py-8">
            לא נמצאו משפחות.
          </p>
        )}
      </div>

      {openAdd && (
        <FamilyForm
          onClose={() => setOpenAdd(false)}
          onSave={handleAdd}
          branches={branches}
          profiles={profiles}
          existingFamilies={families.data}
          defaultBranchId={profile?.branch_id}
          defaultResponsibleId={
            profile?.role === 'service' ? profile.id : undefined
          }
        />
      )}

      {editFamily && (
        <FamilyForm
          family={editFamily}
          onClose={() => setEditFamily(null)}
          onSave={handleUpdate}
          onDelete={handleDelete}
          branches={branches}
          profiles={profiles}
          existingFamilies={families.data}
        />
      )}

      {openSwap && (
        <ChangeoverModal
          onClose={onCloseSwap}
          onSwap={handleSwap}
          profiles={profiles}
          families={families.data}
        />
      )}
    </div>
  )
}
