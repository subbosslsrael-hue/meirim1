import React, { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import ActivityCard from './ActivityCard'
import ActivityForm from './ActivityForm'
import ActivityChat from './ActivityChat'
import DebriefModal from './DebriefModal'
import LoadingScreen from '../shared/LoadingScreen'
import { PROJECTS } from '../../lib/constants'
import { useAuth } from '../../contexts/AuthContext'
import { useActivities } from '../../hooks/useActivities'
import { useBranches } from '../../hooks/useBranches'
import { useProfiles } from '../../hooks/useProfiles'
import { supabase } from '../../lib/supabase'

const NEXT_STATUS = {
  planning: 'active',
  active: 'done',
  done: 'planning',
}

export default function ActivitiesPage() {
  const { profile } = useAuth()
  const activities = useActivities()
  const { data: branches } = useBranches()
  const { data: profiles } = useProfiles()

  const instructors = profiles.filter((p) => p.role === 'instructor')
  const [filter, setFilter] = useState('הכל')
  const [q, setQ] = useState('')
  const [openAdd, setOpenAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [chatting, setChatting] = useState(null)
  const [debriefing, setDebriefing] = useState(null)

  if (activities.loading) return <LoadingScreen message="טוען פעילויות…" />

  const list = activities.data.filter(
    (a) =>
      (filter === 'הכל' || a.project === filter) &&
      [a.name, a.project, a.required_skills, a.debrief_note]
        .join(' ')
        .includes(q),
  )

  const cycle = async (a) => {
    await activities.update(a.id, { status: NEXT_STATUS[a.status] || 'planning' })
  }

  const saveDebrief = async (updates) => {
    if (!debriefing) return
    await activities.update(debriefing.id, updates)
  }

  const handleAdd = async ({ instructorIds, ...rest }) => {
    const inserted = await activities.insert({ ...rest, created_by: profile.id })
    if (instructorIds?.length) {
      const rows = instructorIds.map((pid) => ({
        activity_id: inserted.id,
        profile_id: pid,
      }))
      const { error } = await supabase.from('activity_instructors').insert(rows)
      if (error) throw error
      await activities.mutate()
    }
  }

  const handleUpdate = async ({ instructorIds, ...rest }) => {
    await activities.update(editing.id, rest)
    // סנכרון מדריכים: הסרת מי שהוסר, הוספת מי שנוסף.
    const existing = (editing.instructors || [])
      .map((r) => r.profile?.id)
      .filter(Boolean)
    const next = instructorIds || []
    const toRemove = existing.filter((id) => !next.includes(id))
    const toAdd = next.filter((id) => !existing.includes(id))
    if (toRemove.length) {
      const { error } = await supabase
        .from('activity_instructors')
        .delete()
        .eq('activity_id', editing.id)
        .in('profile_id', toRemove)
      if (error) throw error
    }
    if (toAdd.length) {
      const rows = toAdd.map((pid) => ({
        activity_id: editing.id,
        profile_id: pid,
      }))
      const { error } = await supabase.from('activity_instructors').insert(rows)
      if (error) throw error
    }
    await activities.mutate()
  }

  const toggleSignup = async (activity, currentlyIn) => {
    if (currentlyIn) {
      const { error } = await supabase
        .from('activity_participants')
        .delete()
        .eq('activity_id', activity.id)
        .eq('profile_id', profile.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('activity_participants')
        .insert({ activity_id: activity.id, profile_id: profile.id })
      if (error) throw error
    }
    await activities.mutate()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש בפעילויות (שם / מיומנות / תחקור)…"
            className="w-full pr-9 pl-3 py-2 rounded-xl border border-stone-200 bg-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
        </div>
        {profile?.role !== 'volunteer' && (
          <button
            onClick={() => setOpenAdd(true)}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-semibold shadow"
          >
            <Plus size={18} /> פעילות
          </button>
        )}
      </div>

      <div className="flex gap-1 flex-wrap">
        {['הכל', ...PROJECTS].map((p) => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
              filter === p
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-stone-200 text-stone-600'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {list.map((a) => (
          <ActivityCard
            key={a.id}
            activity={a}
            currentProfile={profile}
            onCycle={cycle}
            onDebrief={setDebriefing}
            onToggleSignup={toggleSignup}
            onEdit={setEditing}
            onChat={setChatting}
          />
        ))}
        {list.length === 0 && (
          <p className="text-stone-400 text-sm text-center py-8">
            לא נמצאו פעילויות.
          </p>
        )}
      </div>

      {openAdd && (
        <ActivityForm
          onClose={() => setOpenAdd(false)}
          onSave={handleAdd}
          branches={branches}
          instructors={instructors}
          defaultBranchId={profile?.branch_id}
          lockBranch={profile?.role === 'service'}
        />
      )}

      {editing && (
        <ActivityForm
          activity={editing}
          onClose={() => setEditing(null)}
          onSave={handleUpdate}
          branches={branches}
          instructors={instructors}
          defaultBranchId={profile?.branch_id}
          lockBranch={profile?.role === 'service'}
        />
      )}

      {chatting && (
        <ActivityChat
          activity={chatting}
          currentProfile={profile}
          onClose={() => setChatting(null)}
        />
      )}

      {debriefing && (
        <DebriefModal
          activity={debriefing}
          onClose={() => setDebriefing(null)}
          onSave={saveDebrief}
        />
      )}
    </div>
  )
}
