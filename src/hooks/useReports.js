import { useSupabaseTable } from './useSupabaseTable'

export function useReports({ enabled = true } = {}) {
  return useSupabaseTable({
    table: 'activity_reports',
    select: `
      id, profile_id, week, project, hours, note, created_at,
      profile:profiles(id, name, role, branch_id)
    `,
    orderBy: { column: 'created_at', ascending: false },
    enabled,
  })
}
