import React from 'react'
import { MapPin, Phone, UserCheck, Pencil, StickyNote } from 'lucide-react'
import Card from '../shared/Card'

export default function FamilyCard({
  family,
  currentProfile,
  onAssignToMe,
  onEdit,
}) {
  const isService = currentProfile?.role === 'service'
  const mine = isService && family.responsible_profile_id === currentProfile.id
  const canEdit =
    currentProfile?.role === 'admin' || currentProfile?.role === 'service'

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-bold text-stone-800 truncate">{family.name}</div>
          <div className="text-xs text-emerald-700 font-semibold mt-0.5">
            {family.branch?.name || '—'}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-1 rounded-lg leading-tight max-w-[120px] text-center">
            {family.need_category}
          </span>
          {canEdit && onEdit && (
            <button
              onClick={() => onEdit(family)}
              title="עריכת פרטים"
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="mt-3 space-y-1.5 text-sm text-stone-600">
        <div className="flex items-center gap-1.5">
          <MapPin size={14} className="text-stone-400" />
          {family.city}{family.address ? `, ${family.address}` : ''}
        </div>
        <div className="flex items-center gap-1.5">
          <Phone size={14} className="text-stone-400" />
          {family.phone || '—'}
        </div>
        <div className="flex items-center gap-1.5">
          <UserCheck size={14} className="text-stone-400" />
          אחראית: {family.responsible?.name || '—'}
        </div>
      </div>
      {family.notes && (
        <div className="mt-3 flex items-start gap-1.5 text-xs text-stone-600 bg-stone-50 border border-stone-100 rounded-lg p-2">
          <StickyNote size={13} className="text-stone-400 mt-0.5 shrink-0" />
          <span className="whitespace-pre-wrap break-words">{family.notes}</span>
        </div>
      )}
      {isService && !mine && (
        <button
          onClick={() => onAssignToMe(family.id)}
          className="mt-3 w-full text-xs font-semibold py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
        >
          + השתבצי אליי כאחראית
        </button>
      )}
      {mine && (
        <div className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg py-1.5 text-center font-semibold">
          משפחה באחריותך
        </div>
      )}
    </Card>
  )
}
