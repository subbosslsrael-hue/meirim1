import { useSupabaseTable } from './useSupabaseTable'

export function useActivityArchives({ enabled = true } = {}) {
  return useSupabaseTable({
    table: 'activity_archives',
    select: `
      id, name, project, branch_id, activity_date, activity_time, location,
      participants, signed_count, what_was_good, what_needs_improvement,
      rating, files, archived_at,
      branch:branches(id, name, city)
    `,
    orderBy: { column: 'archived_at', ascending: false },
    enabled,
  })
}
