import { useSupabaseTable } from './useSupabaseTable'

export function useFamilies({ enabled = true } = {}) {
  return useSupabaseTable({
    table: 'families',
    select: `
      id, name, city, address, phone, need_category,
      branch_id, responsible_profile_id,
      lat, lng, door_photo_url, intake_date, notes,
      branch:branches(id, name, city),
      responsible:profiles!families_responsible_profile_id_fkey(id, name, phone)
    `,
    orderBy: { column: 'name', ascending: true },
    enabled,
  })
}
