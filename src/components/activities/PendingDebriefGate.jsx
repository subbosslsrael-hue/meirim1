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
    const { data } = await supabase
      .from('activities')
      .select('id, name, rating, activity_date, created_by')
      .eq('created_by', profile.id)
      .lt('activity_date', localToday())
      .order('activity_date', { ascending: true })
    setPending(data || [])
  }, [profile?.id])

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
    />
  )
}
