import { useSupabaseTable } from './useSupabaseTable'

export function useBranches({ enabled = true } = {}) {
  return useSupabaseTable({
    table: 'branches',
    select: 'id, name, city',
    orderBy: { column: 'name', ascending: true },
    enabled,
  })
}
