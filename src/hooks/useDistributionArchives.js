import { useSupabaseTable } from './useSupabaseTable'

export function useDistributionArchives({ enabled = true } = {}) {
  return useSupabaseTable({
    table: 'distribution_archives',
    select: 'id, name, dist_date, items, branch_id, total_stops, delivered_count, summary, archived_at, expires_at, branch:branches(id, name, city)',
    orderBy: { column: 'archived_at', ascending: false },
    realtime: true,
    enabled,
  })
}
