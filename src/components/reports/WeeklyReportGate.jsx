import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { currentReportWeek } from '../../lib/week'
import WeeklyReportModal from './WeeklyReportModal'

// חלון דיווח שבועי חוסם לבת שירות, פעם בשבוע (איפוס בשבת 00:00).
export default function WeeklyReportGate() {
  const { profile } = useAuth()
  const [needed, setNeeded] = useState(false)
  const [activities, setActivities] = useState([])
  const week = currentReportWeek()

  const check = useCallback(async () => {
    if (!profile?.id) return
    const { count } = await supabase
      .from('activity_reports')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profile.id)
      .eq('week', week)
    setNeeded((count || 0) === 0)
  }, [profile?.id, week])

  useEffect(() => {
    check()
    supabase
      .from('activities')
      .select('id, name, project')
      .then(({ data }) => setActivities(data || []))
  }, [check])

  if (!needed) return null

  return (
    <WeeklyReportModal
      blocking
      profile={profile}
      activities={activities}
      onSaved={() => setNeeded(false)}
    />
  )
}
