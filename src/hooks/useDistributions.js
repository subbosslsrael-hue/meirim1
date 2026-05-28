import { useSupabaseTable } from './useSupabaseTable'

export function useDistributions({ enabled = true } = {}) {
  return useSupabaseTable({
    table: 'distributions',
    select: `
      id, name, dist_date, items, branch_id,
      branch:branches(id, name, city),
      stops:distribution_stops(
        id, family_id, delivered, delivered_at, photo_url, route_order, claimed_by,
        family:families(id, name, city, address, phone, lat, lng, door_photo_url),
        claimer:profiles!distribution_stops_claimed_by_fkey(id, name)
      )
    `,
    orderBy: { column: 'dist_date', ascending: false },
    realtime: true,
    enabled,
  })
}
