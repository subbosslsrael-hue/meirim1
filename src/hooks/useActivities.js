import { useSupabaseTable } from './useSupabaseTable'

export function useActivities({ enabled = true } = {}) {
  return useSupabaseTable({
    table: 'activities',
    select: `
      id, name, project, activity_date, activity_time, location, status,
      participants, cost, required_skills, branch_id, created_by,
      rating, debrief_note,
      branch:branches(id, name, city),
      instructors:activity_instructors(profile:profiles(id, name, skills)),
      participants_list:activity_participants(profile:profiles(id, name))
    `,
    orderBy: { column: 'activity_date', ascending: false },
    realtime: true,
    enabled,
  })
}
