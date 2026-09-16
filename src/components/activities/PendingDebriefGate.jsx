import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import ActivityDebrief from './ActivityDebrief'

// תאריך מקומי כ-YYYY-MM-DD
const localToday = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

// חלון תחקור חוסם ליוצר הפעילות, יום אחרי שהתקיימה (activity_date בעבר).
export default function PendingDebriefGate() {
  const { profile } = useAuth()
  const [pending, setPending] = useState([])

  const load = useCallback(async () => {
    if (!profile?.id) return
    const today = localToday()
    const build = (cols) =>
      supabase
        .from('activities')
        .select(cols)
        .eq('created_by', profile.id)
        .lt('activity_date', today)
        .order('activity_date', { ascending: true })
    // ניסיון עם העמודה debrief_deferred; אם היא עוד לא קיימת ב-DB — נטען בלעדיה.
    let { data, error } = await build(
      'id, name, rating, activity_date, created_by, debrief_deferred',
    )
    if (error) {
      const res = await build('id, name, rating, activity_date, created_by')
      data = res.data
    }
    // פעילות ש"נדחתה" (דלג/לא התקיימה) לא חוסמת — היא נשארת בתזכורת בלוח הבקרה.
    setPending((data || []).filter((a) => !a.debrief_deferred))
  }, [profile?.id])

  const skip = useCallback(
    async (id) => {
      await supabase.rpc('defer_activity_debrief', { p_activity_id: id })
      await load()
    },
    [load],
  )

  useEffect(() => {
    load()
  }, [load])

  if (!pending.length) return null

  return (
    <ActivityDebrief
      key={pending[0].id}
      activity={pending[0]}
      blocking
      onDone={load}
      onSkip={() => skip(pending[0].id)}
    />
  )
}
