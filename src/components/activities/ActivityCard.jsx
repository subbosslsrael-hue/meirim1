import React from 'react'
import {
  Building2,
  CalendarHeart,
  Users,
  Package,
  HandHeart,
  Star,
  ClipboardList,
} from 'lucide-react'
import Card from '../shared/Card'
import Stars from '../shared/Stars'
import { STATUS } from '../../lib/constants'

export default function ActivityCard({
  activity,
  currentProfile,
  onCycle,
  onDebrief,
  onToggleSignup,
}) {
  const instructorNames = (activity.instructors || [])
    .map((row) => row.profile?.name)
    .filter(Boolean)
    .join(', ')

  const signedUp = (activity.participants_list || []).some(
    (row) => row.profile?.id === currentProfile?.id,
  )
  const signedCount = (activity.participants_list || []).length

  const isVolunteer = currentProfile?.role === 'volunteer'
  const canManage =
    currentProfile?.role === 'admin' ||
    (currentProfile?.role === 'service' &&
      activity.branch_id === currentProfile.branch_id)

  return (
    <Card className="p-4">
      <div className="flex flex-col md:flex-row md:items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-stone-800">{activity.name}</span>
            <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
              {activity.project}
            </span>
          </div>
          <div className="text-sm text-stone-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
            <span className="flex items-center gap-1">
              <Building2 size={13} />
              {activity.branch?.name || '—'}
            </span>
            <span className="flex items-center gap-1">
              <CalendarHeart size={13} />
              {activity.activity_date || '—'}
            </span>
            <span className="flex items-center gap-1">
              <Users size={13} />
              {activity.participants} משתתפים
            </span>
            <span className="flex items-center gap-1">
              <Package size={13} />₪{activity.cost}
            </span>
          </div>
          <div className="text-sm text-stone-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
            <span className="flex items-center gap-1">
              <HandHeart size={13} />
              {instructorNames || 'ללא מדריך'}
            </span>
            {activity.required_skills && (
              <span className="flex items-center gap-1 text-amber-600">
                <Star size={13} />
                נדרש: {activity.required_skills}
              </span>
            )}
            {signedCount > 0 && (
              <span className="flex items-center gap-1 text-emerald-700">
                <Users size={13} />
                נרשמו: {signedCount} מתנדבים
              </span>
            )}
          </div>
          {activity.status === 'done' &&
            (activity.rating || activity.debrief_note) && (
              <div className="mt-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-stone-600">
                    תחקור:
                  </span>
                  <Stars value={activity.rating} />
                </div>
                {activity.debrief_note && (
                  <p className="text-stone-600 text-xs">{activity.debrief_note}</p>
                )}
              </div>
            )}
          {isVolunteer && activity.status !== 'done' && (
            <button
              onClick={() => onToggleSignup(activity, signedUp)}
              className={`mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg ${
                signedUp
                  ? 'bg-emerald-600 text-white'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {signedUp ? '✓ נרשמת — לחץ לביטול' : '+ אני נרשם/ת'}
            </button>
          )}
        </div>

        {canManage && (
          <div className="flex md:flex-col gap-2 shrink-0">
            <button
              onClick={() => onCycle(activity)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${STATUS[activity.status]?.cls || ''}`}
            >
              {STATUS[activity.status]?.label || activity.status} ↻
            </button>
            <button
              onClick={() => onDebrief(activity)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 flex items-center gap-1 justify-center"
            >
              <ClipboardList size={13} /> תחקור
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}
