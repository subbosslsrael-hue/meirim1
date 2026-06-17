import { useSupabaseTable } from './useSupabaseTable'

export function useProfiles({ enabled = true } = {}) {
  return useSupabaseTable({
    table: 'profiles',
    select:
      'id, name, role, phone, age, branch_id, skills, active_from, active_until, branch:branches(id, name, city)',
    orderBy: { column: 'name', ascending: true },
    enabled,
  })
}
